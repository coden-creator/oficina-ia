#!/usr/bin/env python3
"""One bounded owner-run host correction; later App deployments use EasyPanel.

No remote command listener, Docker socket mounts, Codex credential access,
shared proxy/network edits, paid calls, content generation, or data deletion.
"""
import base64
import hashlib
import http.client
import importlib.util
import json
import ipaddress
import os
from pathlib import Path
import secrets
import ssl
import socket
import subprocess
import sys
import tempfile
import time

spec = importlib.util.spec_from_file_location('review', Path(__file__).with_name('deploy-review-office.py'))
d = importlib.util.module_from_spec(spec)
spec.loader.exec_module(d)
APP_HOST = 'service-oficina-jorge.flb2mp.easypanel.host'
PROJECT_NETWORK = 'easypanel-service'
GATEWAY = 'oficina_easypanel_route_r1'
PURPOSE = 'jorge-easypanel-route-r1'
CONNECTIONS = 'oficina-jorge-connections-r1'
OLD_KEY = 'oficina-jorge-connections-key-r1'
KEY_VOLUME = 'oficina-jorge-connections-key-r2'
STATE = Path.home()/'oficina-easypanel-handoff-r1.json'
BRANDS = ['glowfy', 'velforce', 'quiba', 'purify', 'coden']


def private_json(file, value):
    fd = os.open(file, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as out:
        json.dump(value, out)


def checked_source():
    relative = 'deployment-review/managed-route.mjs'
    file = d.ROOT/relative
    digest = hashlib.sha256(file.read_bytes()).hexdigest()
    checksums = {line.split(None, 1)[1].removeprefix('./'): line.split()[0]
                 for line in (d.ROOT/'SHA256SUMS').read_text().splitlines()}
    d.require(checksums.get(relative) == digest, 'La ruta no coincide con SHA256SUMS.')
    return file, digest


def validate_targets(app, review):
    d.require(app['Spec']['Name'] == d.ORIGINAL, 'App inesperado.')
    d.require(review and review['Spec']['Name'] == d.SERVICE and d.owned(review), 'Web de revisión desconocida.')
    for service in (app, review):
        s = service['Spec']
        d.require(s['Mode'].get('Replicated', {}).get('Replicas') in (0, 1), 'Réplicas inesperadas.')
        limit = s['TaskTemplate']['Resources']['Limits']
        d.require(0 < limit.get('NanoCPUs', 0) <= 1000000000
                  and 0 < limit.get('MemoryBytes', 0) <= 768*1024**2, 'Límites inesperados.')
        d.require(not s.get('EndpointSpec', {}).get('Ports'), 'Puertos públicos inesperados.')
    container = review['Spec']['TaskTemplate']['ContainerSpec']
    d.require(container['Image'].split('@')[0] == d.IMAGE
              and container.get('ReadOnly') is True and container.get('User') == '1000:1000'
              and 'ALL' in container.get('CapabilityDrop', []), 'Aislamiento de revisión inesperado.')
    mounts = container.get('Mounts', [])
    expected = {d.VIDEO: ('/data/video', False), d.IPC: ('/run/office', True), CONNECTIONS: ('/data/connections', False)}
    seen = set()
    for mount in mounts:
        if mount['Type'] == 'tmpfs':
            continue
        d.require(mount['Type'] == 'volume' and mount['Source'] in expected, 'Montaje de revisión inesperado.')
        target, readonly = expected[mount['Source']]
        d.require(mount['Target'] == target and bool(mount.get('ReadOnly')) == readonly, 'Destino de volumen inesperado.')
        seen.add(mount['Source'])
    d.require({d.VIDEO, d.IPC}.issubset(seen), 'Faltan los volúmenes de video/socket.')
    network = d.inspect('network', PROJECT_NETWORK)
    d.require(network['Driver'] == 'overlay' and network['Scope'] == 'swarm'
              and any(n['Target'] == network['Id'] for n in app['Spec']['TaskTemplate']['Networks']),
              'La red del App no es la esperada; no se modifica.')
    return network


def owned_route(value):
    return value.get('Spec', value).get('Labels', {}).get('office.purpose') == PURPOSE


def fixed_route_spec(node, config_name):
    router = 'oficina_easypanel_route_r1'
    labels = {'office.purpose': PURPOSE, 'traefik.enable': 'true', 'traefik.swarm.network': 'CodeNet',
              f'traefik.http.routers.{router}.rule': f'Host(`{APP_HOST}`) || Host(`{d.HOST}`)',
              f'traefik.http.routers.{router}.entrypoints': 'websecure',
              f'traefik.http.routers.{router}.priority': '1000',
              f'traefik.http.routers.{router}.tls.certresolver': 'letsencryptresolver',
              f'traefik.http.routers.{router}.service': router,
              f'traefik.http.services.{router}.loadbalancer.server.port': '3000',
              f'traefik.http.services.{router}.loadbalancer.passHostHeader': 'true'}
    args = ['service', 'create', '--detach=true', '--no-resolve-image', '--name', GATEWAY,
            '--constraint', 'node.hostname=='+node, '--replicas', '1', '--user', '1000:1000',
            '--read-only', '--cap-drop', 'ALL', '--limit-cpu', '0.1', '--limit-memory', '64M',
            '--network', 'CodeNet', '--network', PROJECT_NETWORK,
            '--config', 'source='+config_name+',target=/app/managed-route.mjs,uid=1000,gid=1000,mode=0444',
            '--health-cmd', "node -e \"require('http').get({hostname:'127.0.0.1',port:3000,path:'/office-route-health',headers:{host:'"+APP_HOST+"'}},r=>{r.resume();process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))\"",
            '--health-interval', '15s', '--health-timeout', '5s', '--health-retries', '3']
    for key, value in labels.items():
        args += ['--label', key+'='+value]
    return args + [d.IMAGE, 'node', '/app/managed-route.mjs']


def route_ready():
    # The TLS handshake completes before any HTTP headers. No authentication is sent.
    address = d.inspect('node', 'self')['Status']['Addr']
    ipaddress.ip_address(address)
    context = ssl.create_default_context()
    connection = http.client.HTTPSConnection(APP_HOST, context=context, timeout=10)
    try:
        # Reach the Swarm node directly, with the public hostname as TLS SNI.
        # A CDN/proxy certificate therefore cannot satisfy this origin check.
        connection.sock = context.wrap_socket(socket.create_connection((address, 443), timeout=10), server_hostname=APP_HOST)
        connection.request('GET', '/office-route-health')
        response = connection.getresponse()
        return response.status == 200 and json.loads(response.read(4096)).get('version') == 'easypanel-app-route-v1'
    finally:
        connection.close()


def wait_route():
    for i in range(36):
        try:
            if route_ready():
                return
        except (OSError, ValueError, http.client.HTTPException):
            pass
        if i % 6 == 5:
            d.emit(step='route', waiting=True, seconds=(i+1)*5)
        time.sleep(5)
    raise d.DeploymentError('No se confirmó la ruta HTTPS fija.')


def bounded_run(mounts, command, root=False):
    args = ['run', '--rm', '--network', 'none', '--read-only', '--user', '0:0' if root else '1000:1000',
            '--cpus', '0.1', '--memory', '128m', '--pids-limit', '32', '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges']
    if root:
        args += ['--cap-add', 'CHOWN', '--cap-add', 'FOWNER']
    for mount in mounts:
        args += ['--mount', mount]
    return [*args, d.IMAGE, *command]


def no_running_jobs():
    code = """const fs=require('fs');let n=0;for(const b of ['glowfy','velforce','quiba','purify','coden']){const p='/videos/'+b;if(!fs.existsSync(p))continue;for(const id of fs.readdirSync(p)){const f=p+'/'+id+'/job.json';if(fs.existsSync(f)&&JSON.parse(fs.readFileSync(f)).state==='running')n++;}}process.stdout.write(String(n));"""
    count = d.docker(*bounded_run(['type=volume,source='+d.VIDEO+',target=/videos,readonly'], ['node', '-e', code]))
    d.require(count == '0', 'Hay fichas en ejecución. No se interrumpe su producción; reintentar cuando termine.')


def volume_mountpoint(name):
    volume = d.inspect('volume', name)
    d.require(volume.get('Driver') == 'local' and not volume.get('Options'), 'Volumen no local o con opciones inesperadas.')
    point = volume.get('Mountpoint', '')
    d.require(Path(point).is_absolute() and point.endswith('/'+name+'/_data'), 'Ruta de volumen inesperada.')
    return point


def backup_volume(name, directory):
    file = directory/(name+'.tar')
    fd = os.open(file, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'wb') as output:
        result = subprocess.run(['docker', *bounded_run(['type=volume,source='+name+',target=/data,readonly'],
                                 ['tar', '-C', '/data', '-cf', '-', '.'])], stdout=output, stderr=subprocess.PIPE, timeout=180)
    d.require(result.returncode == 0 and file.stat().st_size > 0, 'No se pudo completar el respaldo de '+name)


def initialize_private_volume(name, purpose):
    if name not in d.ids('volume'):
        d.docker('volume', 'create', '--label', 'office.purpose='+purpose, name)
    volume = d.inspect('volume', name)
    d.require(volume.get('Labels', {}).get('office.purpose') == purpose, 'Volumen ajeno; no se adopta: '+name)
    code = """const f=require('fs'),p='/private',s=f.statSync(p);if(s.uid===1000&&(s.mode&63)===0)process.exit(0);if(f.readdirSync(p).length)process.exit(1);f.chownSync(p,1000,1000);f.chmodSync(p,448);"""
    d.docker(*bounded_run(['type=volume,source='+name+',target=/private'], ['node', '-e', code], root=True))


def prepare_connections(node):
    data_exists = CONNECTIONS in d.ids('volume')
    key_exists = KEY_VOLUME in d.ids('volume')
    secret_exists = OLD_KEY in d.ids('secret')
    d.require(not data_exists or key_exists or secret_exists, 'Conexiones tiene datos sin llave recuperable; no se crea otra llave.')
    if secret_exists:
        d.require(d.owned(d.inspect('secret', OLD_KEY)), 'Secreto de conexiones ajeno.')
    initialize_private_volume(CONNECTIONS, d.PURPOSE)
    initialize_private_volume(KEY_VOLUME, PURPOSE)
    mount = 'type=volume,source='+KEY_VOLUME+',target=/private'
    if not key_exists:
        if secret_exists:
            # Known secret -> new private volume. Nothing is returned in logs/stdout.
            name = 'office-key-handoff-'+secrets.token_hex(6)
            code = "const f=require('fs'),b=f.readFileSync('/run/secrets/key');if(b.length!==32)process.exit(1);f.writeFileSync('/private/encryption.key',b,{flag:'wx',mode:256});b.fill(0);"
            d.docker('service', 'create', '--detach=true', '--no-resolve-image', '--name', name,
                     '--label', 'office.purpose='+PURPOSE, '--constraint', 'node.hostname=='+node,
                     '--restart-condition', 'none', '--user', '1000:1000', '--read-only', '--cap-drop', 'ALL',
                     '--limit-cpu', '0.1', '--limit-memory', '64M', '--mount', mount,
                     '--secret', 'source='+OLD_KEY+',target=key,uid=1000,gid=1000,mode=0400',
                     d.IMAGE, 'node', '-e', code)
            try:
                complete = False
                for _ in range(30):
                    tasks = d.docker('service', 'ps', '-q', '--no-trunc', name).splitlines()
                    if tasks:
                        task = json.loads(d.docker('inspect', tasks[0]))[0]
                        state = task['Status']['State']
                        if state == 'complete':
                            complete = task['Status'].get('ContainerStatus', {}).get('ExitCode') == 0
                            break
                        if state in ('failed', 'rejected'):
                            break
                    time.sleep(2)
                d.require(complete, 'No se pudo trasladar la llave existente; se conserva el secreto original.')
            finally:
                if owned_route(d.inspect('service', name)):
                    d.docker('service', 'rm', name)  # Only this completed temporary copy task.
        else:
            code = "const f=require('fs'),b=require('crypto').randomBytes(32);f.writeFileSync('/private/encryption.key',b,{flag:'wx',mode:256});b.fill(0);"
            d.docker(*bounded_run([mount], ['node', '-e', code]))
    check = "const f=require('fs'),s=f.lstatSync('/private/encryption.key');if(!s.isFile()||s.isSymbolicLink()||s.uid!==1000||(s.mode&63)||s.size!==32)process.exit(1);"
    d.docker(*bounded_run([mount+',readonly'], ['node', '-e', check]))


def output_handoff(backup):
    d.emit(ok=True, readyForEasyPanel=True, originTlsVerified=True, url='https://'+APP_HOST, backup=str(backup),
           projectName='service', serviceName='oficina-jorge', buildFile='Dockerfile.easypanel',
           bindMounts=[{'hostPath':volume_mountpoint(name)+('/encryption.key' if name == KEY_VOLUME else ''), 'mountPath':target, 'type':'bind'}
                       for name, target in [(d.VIDEO, '/data/video'), (d.IPC, '/run/office'),
                                            (CONNECTIONS, '/data/connections'), (KEY_VOLUME, '/run/secrets/office_connections_key')]],
           workerUnchanged=True, loginPreserved=True, inferencePerformed=False, published=False,
           next='Aplicar fuente, montajes y variables al App existente mediante MCP; luego Deploy y comprobar la conexión.')


def cpu_margin():
    total = 1.0  # Worker checked by d.preflight, with a one-CPU limit.
    for name in d.ids('service'):
        if 'oficina' not in name:
            continue
        service = d.inspect('service', name)['Spec']
        limit = service['TaskTemplate'].get('Resources', {}).get('Limits', {}).get('NanoCPUs', 0)
        replicas = service.get('Mode', {}).get('Replicated', {}).get('Replicas')
        d.require(limit > 0 and isinstance(replicas, int), 'CPU o réplicas de oficina sin verificar.')
        total += limit/1e9 * replicas
    d.require(total + 0.2 <= 5, 'Sin margen para ruta y preparación dentro de 5 CPU.')


def resume_handoff(digest):
    st = STATE.lstat()
    d.require(not STATE.is_symlink() and st.st_uid == os.getuid() and st.st_mode & 0o077 == 0, 'Estado de migración inseguro.')
    state = json.loads(STATE.read_text())
    gateway = d.inspect('service', GATEWAY)
    review = d.inspect('service', d.SERVICE)
    worker = d.inspect('container', d.WORKER)
    d.require(owned_route(gateway) and state['routeDigest'] == digest
              and gateway['Spec']['Mode']['Replicated']['Replicas'] == 1
              and d.owned(review) and review['Spec']['Mode']['Replicated']['Replicas'] == 0
              and worker['State'].get('Health', {}).get('Status') == 'healthy' and d.limits_ok(worker),
              'La entrega existente cambió; no se reemplaza.')
    wait_route()
    output_handoff(state['backup'])


def main():
    source, digest = checked_source()
    if STATE.exists():
        resume_handoff(digest)
        return
    node, app, review = d.preflight()
    validate_targets(app, review)
    cpu_margin()
    d.require(GATEWAY not in d.ids('service'), 'Ya existe una ruta sin estado confirmado; conservar y revisar, no duplicar.')
    d.require(review['Spec']['Mode']['Replicated']['Replicas'] == 1, 'La revisión no está activa para preparar el traslado.')
    d.require(not any(v.startswith('OFFICE_ENABLE_VIDEO_WORKFLOW=1') for v in app['Spec']['TaskTemplate']['ContainerSpec'].get('Env', [])),
              'El App ya procesa fichas; no se inicia otra migración.')
    no_running_jobs()
    backup = Path(tempfile.mkdtemp(prefix='oficina-easypanel-backup-', dir=Path.home()))
    private_json(backup/'app-service.json', app)
    private_json(backup/'review-service.json', review)
    d.emit(step='backup', directory=str(backup))
    config_name = 'office-managed-route-'+digest[:24]
    if config_name not in d.ids('config'):
        d.docker('config', 'create', '--label', 'office.purpose='+PURPOSE, config_name, str(source))
    config = d.inspect('config', config_name)
    d.require(owned_route(config) and hashlib.sha256(base64.b64decode(config['Spec']['Data'])).hexdigest() == digest, 'Config de ruta ajeno o modificado.')
    route_created = False
    review_stopped = False
    marker_created = False
    try:
        d.require(d.inspect('service', d.ORIGINAL)['Version']['Index'] == app['Version']['Index'], 'El App cambió durante la preparación.')
        d.docker(*fixed_route_spec(node, config_name))
        route_created = True
        wait_route()
        no_running_jobs()  # New requests now reach the unchanged App, not the review writer.
        d.require(d.inspect('service', d.SERVICE)['Version']['Index'] == review['Version']['Index'], 'La revisión cambió durante la preparación.')
        d.docker('service', 'scale', '--detach=true', d.SERVICE+'=0')
        review_stopped = True
        for _ in range(30):
            if not d.docker('ps', '-q', '--filter', 'label=com.docker.swarm.service.name='+d.SERVICE):
                break
            time.sleep(1)
        else:
            raise d.DeploymentError('No se confirmó la pausa del servidor anterior.')
        d.require(d.inspect('service', d.ORIGINAL)['Version']['Index'] == app['Version']['Index'], 'El App cambió durante el traslado; revisar antes de continuar.')
        backup_volume(d.VIDEO, backup)
        if CONNECTIONS in d.ids('volume'):
            d.require(d.owned(d.inspect('volume', CONNECTIONS)), 'Volumen de conexiones ajeno.')
            backup_volume(CONNECTIONS, backup)
        prepare_connections(node)
        d.resource_check()
        state = {'backup':str(backup), 'routeDigest':digest, 'phase':'ready-for-easypanel', 'reviewService':d.SERVICE, 'appService':d.ORIGINAL}
        private_json(STATE, state)
        marker_created = True
        output_handoff(backup)
    except BaseException:
        # Do not revive the old writer over an App concurrently changed by its owner.
        app_unchanged = d.inspect('service', d.ORIGINAL)['Version']['Index'] == app['Version']['Index']
        if review_stopped and app_unchanged:
            d.docker('service', 'scale', '--detach=true', d.SERVICE+'=1')
        if route_created and app_unchanged and owned_route(d.inspect('service', GATEWAY)):
            d.docker('service', 'rm', GATEWAY)  # Only the new route created by this transaction.
        if not app_unchanged:
            d.emit(step='recovery', automaticRestore=False, message='El App fue modificado durante la preparación. Se conservan los servicios y respaldos para evitar dos escritores.')
        if marker_created and json.loads(STATE.read_text()) == state:
            STATE.unlink()
        raise


if __name__ == '__main__':
    try:
        main()
    except d.DeploymentError as error:
        d.emit(ok=False, error=str(error), resourcesPreserved=True)
        sys.exit(1)
    except KeyboardInterrupt:
        d.emit(ok=False, error='Interrumpido; revisar salida y respaldos antes de reintentar.', resourcesPreserved=True)
        sys.exit(130)
    except Exception:
        d.emit(ok=False, error='Preparación interrumpida; conservar salida y respaldos. No se muestran credenciales.', resourcesPreserved=True)
        sys.exit(1)

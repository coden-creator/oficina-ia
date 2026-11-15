#!/usr/bin/env python3
"""Owner-run VPS deployment. No dependencies, shell execution or printed credentials.

Only creates/adopts resources bearing this release's exact purpose label. The
existing public office, worker, auth volume, CodeNet and Traefik are read-only.
--test-video requests one included-plan internal draft; never approves/publishes.
"""
import argparse
import base64
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import secrets
import ssl
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parent.parent
STACK = 'oficina_codex_review_r1'
SERVICE = STACK + '_office'
PURPOSE = 'jorge-review-web-r1'
IMAGE = 'oficina-runtime:33a3edc'
WORKER = 'service_oficina-codex-codex-1'
ORIGINAL = 'service_oficina-jorge'
HOST = 'service-oficina-review.flb2mp.easypanel.host'
ORIGIN = 'https://' + HOST
IPC = 'oficina-jorge-codex-ipc-r1'
VIDEO = 'oficina-jorge-videos-review-r1'
SECRET = 'oficina-jorge-review-access-r1'
LABEL = 'office.purpose=' + PURPOSE
TEST_OBJECTIVE = ('Prueba interna de conexión Codex r1 para Glowfy. Crear una animática '
                  'silenciosa de 3 escenas, 3 segundos por escena, con texto breve y '
                  'legible. Mostrar una solicitud de video, su borrador y la revisión '
                  'de Jorge. Sin afirmaciones comerciales, logos ni publicación.')


class DeploymentError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise DeploymentError(message)


def emit(**fields):
    print(json.dumps(fields, ensure_ascii=False), flush=True)


def docker(*args, data=None):
    # Never put credentials in argv, environment, disk, exceptions or output.
    try:
        result = subprocess.run(['docker', *args], input=data, capture_output=True,
                                text=True, timeout=120, check=False)
    except (OSError, subprocess.TimeoutExpired):
        raise DeploymentError('Docker no respondió: ' + ' '.join(args[:2])) from None
    require(result.returncode == 0, 'Docker falló: ' + ' '.join(args[:2]))
    return result.stdout.strip()


def inspect(kind, name):
    return json.loads(docker(kind, 'inspect', name))[0]


def ids(kind):
    return docker(kind, 'ls', '--format', '{{.Name}}').splitlines()


def owned(value):
    labels = value.get('Spec', value).get('Labels') or {}
    return labels.get('office.purpose') == PURPOSE


def limits_ok(worker):
    config = worker['HostConfig']
    quota = config.get('NanoCpus', 0) / 1e9
    if not quota and config.get('CpuPeriod', 0) > 0:
        quota = config.get('CpuQuota', 0) / config['CpuPeriod']
    return (0 < quota <= 1 and 0 < config.get('Memory', 0) <= 768*1024**2
            and 0 < config.get('PidsLimit', 0) <= 128
            and config.get('ReadonlyRootfs') is True
            and 'ALL' in (config.get('CapDrop') or [])
            and any(x.split(':')[0].split('=')[0] == 'no-new-privileges'
                    for x in config.get('SecurityOpt') or [])
            and worker['Config'].get('User') in ('1000:1000', '1000'))


def resource_check():
    def sample():
        values = [int(v) for v in Path('/proc/stat').read_text().splitlines()[0].split()[1:9]]
        return sum(values), values[3] + values[4]
    a, idle_a = sample()
    time.sleep(1)
    b, idle_b = sample()
    busy = 1 - (idle_b-idle_a) / max(1, b-a)
    memory = {k: int(v.split()[0])*1024 for k, v in
              (line.split(':', 1) for line in Path('/proc/meminfo').read_text().splitlines())}
    # Reserve both review web and worker capacity above current observed usage.
    require(busy + 2/max(1, os.cpu_count() or 1) < .70,
            'Sin margen de CPU para mantener el VPS por debajo del 70%; reintentar cuando baje el uso.')
    require((memory['MemTotal'] - memory['MemAvailable'] + 1536*1024**2)/memory['MemTotal'] < .70,
            'Sin margen de RAM para mantener el VPS por debajo del 70%.')
    emit(step='resources', cpuPercent=round(busy*100, 1),
         memoryPercent=round((1-memory['MemAvailable']/memory['MemTotal'])*100, 1))


def preflight():
    info = json.loads(docker('info', '--format', '{{json .Swarm}}'))
    require(info.get('LocalNodeState') == 'active' and info.get('ControlAvailable'),
            'Ejecutar en el nodo administrador del VPS con Docker Swarm activo.')
    node = inspect('node', 'self')
    require(node['Status']['State'] == 'ready' and node['Spec']['Availability'] == 'active',
            'El nodo no está disponible para tareas de Swarm.')
    network = inspect('network', 'CodeNet')
    require(network['Driver'] == 'overlay' and network['Scope'] == 'swarm', 'CodeNet no es la red esperada.')
    # attachable=false is explicitly supported; no network mutation is made.
    worker = inspect('container', WORKER)
    require(worker['State'].get('Health', {}).get('Status') == 'healthy'
            and worker['Config']['Labels'].get('office.purpose') == 'jorge-codex-worker'
            and limits_ok(worker), 'El trabajador privado no está saludable o no conserva sus límites.')
    require(any(m.get('Name') == IPC and m['Destination'] == '/run/office'
                for m in worker['Mounts']), 'El trabajador no usa el volumen de socket esperado.')
    require(inspect('image', IMAGE)['Id'] == worker['Image'], 'La imagen web difiere de la del trabajador verificado.')
    inspect('volume', IPC)  # Never silently create a replacement empty IPC volume.
    original = inspect('service', ORIGINAL)
    services = [inspect('service', name) for name in ids('service')]
    existing = next((s for s in services if s['Spec']['Name'] == SERVICE), None)
    for service in services:
        spec = service['Spec']
        if spec['Name'].startswith(STACK + '_'):
            require(spec['Name'] == SERVICE and owned(service), 'Existe un stack ajeno con el nombre de revisión.')
        if spec['Name'] != SERVICE:
            require(not any(HOST in str(v) for k, v in spec.get('Labels', {}).items()
                            if k.startswith('traefik.') and k.endswith('.rule')),
                    'Otro servicio ya usa el dominio de revisión; no se modifica.')
    office_cpu = 1.0  # Existing private worker: bounded to one CPU above.
    for service in services:
        if 'oficina' in service['Spec']['Name'] and service['Spec']['Name'] != SERVICE:
            spec = service['Spec']
            limit = spec['TaskTemplate'].get('Resources', {}).get('Limits', {}).get('NanoCPUs', 0)
            require(limit > 0, 'Otro servicio de oficina no tiene límite de CPU verificable.')
            office_cpu += limit/1e9 * spec.get('Mode', {}).get('Replicated', {}).get('Replicas', 1)
    require(office_cpu + 1 <= 5, 'La oficina excedería el máximo total de 5 CPU.')
    if existing:
        require(owned(existing), 'El servicio de revisión existente no pertenece a esta entrega.')
        require(existing['Spec']['Labels'].get('office.phase') in ('bootstrap', 'connected'), 'Fase desconocida.')
    for kind, name in [('volume', VIDEO), ('secret', SECRET)]:
        if name in ids(kind):
            require(owned(inspect(kind, name)), 'Recurso existente ajeno; no se adopta: ' + name)
    resource_check()
    return node['Description']['Hostname'], original, existing


def manifest(node, marker, bootstrap=False):
    result = json.loads((ROOT/'deployment-review/stack.review-web.json').read_text())
    web = result['services']['office']
    web['environment']['OFFICE_DEPLOYMENT_MARKER'] = marker
    web['deploy']['placement'] = {'constraints': ['node.hostname == ' + node]}
    web['deploy']['labels'].update({'office.phase':'bootstrap' if bootstrap else 'connected',
                                   'office.deployment-marker':marker})
    if bootstrap:
        web['command'] = ['node', '/app/review-https-bootstrap.mjs']
        web['environment'] = {'OFFICE_DEPLOYMENT_MARKER':marker}
        for field in ('secrets', 'volumes'):
            web.pop(field, None)
            result.pop(field, None)
        web['deploy']['resources']['limits'] = {'cpus':'0.25', 'memory':'128M'}
        web['configs'] = [{'source':'bootstrap', 'target':'/app/review-https-bootstrap.mjs'}]
        result['configs'] = {'bootstrap':{'file':'../scripts/review-https-bootstrap.mjs'}}
    for key, config in result['configs'].items():
        file = (ROOT/'deployment-review'/config['file']).resolve()
        config['file'] = str(file)
        config['name'] = STACK + '_' + key + '_' + hashlib.sha256(file.read_bytes()).hexdigest()[:16]
        config['labels'] = {'office.purpose':PURPOSE}
    return result


def deploy(spec):
    # Only non-secret settings and paths are written; Swarm secrets use stdin separately.
    for config in spec['configs'].values():
        if config['name'] in ids('config'):
            require(owned(inspect('config', config['name'])), 'Colisión con un config Docker ajeno.')
    with tempfile.TemporaryDirectory(prefix='oficina-review-stack-') as folder:
        file = Path(folder)/'stack.json'
        file.write_text(json.dumps(spec))
        docker('stack', 'config', '--compose-file', str(file))
        docker('stack', 'deploy', '--resolve-image', 'never', '--compose-file', str(file), STACK)


def request(route, password=None, body=None, binary=False, timeout=15):
    require(route.startswith('/') and not route.startswith('//') and '\r' not in route and '\n' not in route,
            'Ruta HTTP inválida.')
    # Direct HTTPS, system trust, hostname verification, no proxies or redirects.
    # Connect/handshake completes BEFORE constructing/sending Authorization.
    connection = http.client.HTTPSConnection(HOST, 443, context=ssl.create_default_context(), timeout=timeout)
    try:
        connection.connect()
        headers = {'Accept':'application/json'}
        if password is not None:
            headers['Authorization'] = 'Basic ' + base64.b64encode(('jorge:'+password).encode()).decode()
        if body is not None:
            headers.update({'Content-Type':'application/json', 'Origin':ORIGIN})
        connection.request('POST' if body is not None else 'GET', route,
                           body=None if body is None else json.dumps(body), headers=headers)
        response = connection.getresponse()
        require(response.status == 200, 'HTTP ' + str(response.status) + ' en ' + route.split('?')[0])
        limit = 50*1024**2 if binary else 5*1024**2
        data = response.read(limit+1)
        require(len(data) <= limit, 'Respuesta demasiado grande.')
        return data if binary else json.loads(data)
    finally:
        connection.close()


def wait_https(marker, bootstrap):
    emit(step='https', message='Esperando la ruta y el certificado válido del origen, sin enviar credenciales.')
    for attempt in range(60):
        try:
            health = request('/health')
            if (health.get('deploymentMarker') == marker
                    and (health.get('credentialsConfigured') is False if bootstrap else health.get('alive') is True)):
                emit(step='https', originTlsVerified=True)
                return
        except (OSError, ValueError, http.client.HTTPException, DeploymentError):
            pass
        if attempt % 6 == 5:
            emit(step='https', waiting=True, seconds=(attempt+1)*5)
        time.sleep(5)
    raise DeploymentError('No se verificó HTTPS/ruta de esta revisión. Se conservan los recursos; no se envió ninguna contraseña.')


def password_from(original):
    env = original['Spec']['TaskTemplate']['ContainerSpec'].get('Env', [])
    values = [s.split('=', 1)[1] for s in env if s.startswith('OFFICE_PASSWORD=')]
    require(len(values) == 1 and len(values[0]) >= 16 and values[0] == values[0].strip(),
            'No se encontró un acceso compatible en la oficina existente. No pegar credenciales en el chat.')
    return values[0]


def verify_web():
    spec = inspect('service', SERVICE)['Spec']
    container = spec['TaskTemplate']['ContainerSpec']
    mounts = container.get('Mounts', [])
    require(container.get('User') == '1000:1000' and container.get('ReadOnly') is True
            and 'ALL' in container.get('CapabilityDrop', []), 'El servicio web no conserva su aislamiento declarado.')
    require({m['Source'] for m in mounts if m['Type'] == 'volume'} == {IPC, VIDEO},
            'Los montajes web no son exclusivamente video y socket.')
    require(any(m.get('Source') == IPC and m.get('ReadOnly') is True for m in mounts),
            'El volumen IPC web no es de solo lectura.')
    limits = spec['TaskTemplate']['Resources']['Limits']
    require(limits['NanoCPUs'] == 1000000000 and limits['MemoryBytes'] <= 768*1024**2,
            'Los límites efectivos del servicio web no son los esperados.')
    require(not spec.get('EndpointSpec', {}).get('Ports'), 'La web no debe publicar puertos al margen de Traefik.')


def verify_connection(password):
    for _ in range(12):
        config = request('/api/config', password)
        if (config.get('provider') == 'codex-chatgpt-plan'
                and config.get('video', {}).get('runnerConnected') is True
                and config.get('paidApiEnabled') is False
                and config.get('externalActionsEnabled') is False):
            emit(officeConnected=True, url=ORIGIN, paidApiEnabled=False, publishingEnabled=False)
            return
        time.sleep(5)
    raise DeploymentError('La web responde, pero no confirma la conexión privada con Codex.')


def test_video(password):
    route = '/api/video-workflows/glowfy'
    jobs = request(route, password)
    matches = [j for j in jobs if j.get('brief', {}).get('objective') == TEST_OBJECTIVE]
    if matches:
        # Never repeat inference automatically after timeout, interruption or rerun.
        job = matches[0]
        emit(step='video', reusedExistingTest=True, jobId=job['id'], state=job['state'])
    else:
        resource_check()
        job = request(route, password, {'objective':TEST_OBJECTIVE, 'cta':'Revisar borrador',
            'audience':'Jorge; prueba interna', 'channel':'instagram',
            'evidence':[{'id':'brief_owner', 'text':'Prueba interna autorizada por Jorge para comprobar su oficina. Solo se muestran solicitud, borrador y revisión humana; no se presentan funciones comerciales de Glowfy.'}]})
        require(re.fullmatch(r'[a-z0-9-]{1,80}', job['id']) is not None, 'ID de prueba inválido.')
        emit(step='video', jobId=job['id'], message='Ejecutando una prueba con el uso incluido. Puede tardar varios minutos; no repetir el comando.')
        job = request(route+'/'+job['id']+'/run', password, {}, timeout=600)
    real = [s['id'] for s in job['stages'] if s.get('source') == 'codex-chatgpt-plan']
    emit(step='video', jobId=job['id'], state=job['state'], realStages=real,
         technical=job['quality']['technical'], approved=job.get('approval') is not None, published=False)
    require(job['state'] == 'awaiting_review' and job['quality']['technical'] == 'passed'
            and set(real) == {'research','strategy','script','creative_review','art_direction'}
            and job.get('approval') is None, 'La prueba no completó una pieza pendiente de revisión; conservar la ficha y revisar el bloqueo o los cambios solicitados.')
    artifact = job['artifact']
    expected = route+'/'+job['id']+'/artifact?v='+str(job['version'])
    require(artifact['url'] == expected, 'Ruta de artefacto inesperada.')
    data = request(expected, password, binary=True, timeout=60)
    require(hashlib.sha256(data).hexdigest() == artifact['sha256'] and len(data) == artifact['bytes']
            and data[4:8] == b'ftyp', 'El MP4 descargado no coincide con el artefacto validado.')
    emit(realVideoVerified=True, state='awaiting_review', artifactUrl=ORIGIN+expected,
         sha256=artifact['sha256'], bytes=len(data), voiceGenerated=False, published=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--test-video', action='store_true', help='Solicitar una prueba real con uso incluido, sin aprobar ni publicar.')
    args = parser.parse_args()
    node, original, existing = preflight()
    phase = existing['Spec']['Labels']['office.phase'] if existing else None
    marker = existing['Spec']['Labels'].get('office.deployment-marker') if existing else secrets.token_hex(16)
    require(isinstance(marker, str) and re.fullmatch('[a-f0-9]{32}', marker), 'Identificador de despliegue inválido.')
    if phase is None:
        emit(step='bootstrap', message='Creando únicamente la web de revisión sin credenciales.')
        deploy(manifest(node, marker, bootstrap=True))
    wait_https(marker, bootstrap=phase != 'connected')
    # Only after valid origin TLS and exact deployment marker do we use the old password.
    password = password_from(original)
    if phase != 'connected':
        resource_check()
        if SECRET not in ids('secret'):
            docker('secret', 'create', '--label', LABEL, SECRET, '-', data=password)
        if VIDEO not in ids('volume'):
            docker('volume', 'create', '--label', LABEL, VIDEO)
        emit(step='connect', message='Conectando la web al socket privado y al volumen persistente de videos.')
        deploy(manifest(node, marker))
        wait_https(marker, bootstrap=False)
    verify_web()
    verify_connection(password)
    if args.test_video:
        test_video(password)
    else:
        emit(inferencePerformed=False, message='Conexión comprobada. La prueba de video requiere --test-video o una solicitud desde la oficina.')


if __name__ == '__main__':
    try:
        main()
    except DeploymentError as error:
        emit(ok=False, error=str(error), resourcesPreserved=True)
        sys.exit(1)
    except (OSError, ValueError, KeyError, TypeError, http.client.HTTPException):
        # Network/library exceptions may hold request headers; never print them.
        emit(ok=False, error='Verificación interrumpida. Se conservan los recursos y no se reintenta inferencia automáticamente.', resourcesPreserved=True)
        sys.exit(1)
    except KeyboardInterrupt:
        emit(ok=False, error='Interrumpido por el usuario; se conservan los recursos.', resourcesPreserved=True)
        sys.exit(130)

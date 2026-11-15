#!/usr/bin/env python3
"""Update only the existing review web. No API key, inference or voice generation.

Run from the pinned, checksum-verified checkout on the VPS. Keeps the original
office, private Codex worker, proxy, networks, video data and login unchanged.
"""
import hashlib
import base64
import importlib.util
import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import tempfile

spec = importlib.util.spec_from_file_location('review_deploy', Path(__file__).with_name('deploy-review-office.py'))
d = importlib.util.module_from_spec(spec)
spec.loader.exec_module(d)
VOLUME = 'oficina-jorge-connections-r1'
KEY = 'oficina-jorge-connections-key-r1'
DIRECTORY = '/data/connections'
KEY_TARGET = 'office_connections_key'
FILES = ['server.mjs', 'start.mjs', 'connections/store.mjs', 'connections/http.mjs',
         'connections/elevenlabs.mjs', 'production/reference-standard.mjs',
         'video/http.mjs', 'video/video-flow.mjs', 'video/remote-runner.mjs',
         'video/renderer-selection.mjs', 'video/storage-preflight.mjs',
         'video/visual-contract.mjs', 'video/local-renderer.mjs',
         'public/compat-app.js', 'public/navigation.js', 'public/compat.css',
         'public/connections-panel.js', 'public/video-panel.js', 'public/material-import.js']


def source_files():
    checksums = {}
    for line in (d.ROOT/'SHA256SUMS').read_text().splitlines():
        checksum, name = line.split(None, 1)
        checksums[name.lstrip('*').removeprefix('./')] = checksum
    result = []
    for relative in FILES:
        file = d.ROOT/relative
        data = file.read_bytes()
        checksum = hashlib.sha256(data).hexdigest()
        d.require(checksums.get(relative) == checksum and len(data) < 480000,
                  'Archivo sin verificar: ' + relative)
        result.append((relative, file, checksum))
    return result


def validate_web(service):
    d.require(service and d.owned(service), 'No se encontró la web de revisión esperada.')
    spec = service['Spec']
    c = spec['TaskTemplate']['ContainerSpec']
    d.require(c.get('Image', '').split('@')[0] == d.IMAGE, 'La imagen web no es la base verificada para esta actualización.')
    d.require(spec.get('Mode', {}).get('Replicated', {}).get('Replicas') == 1,
              'Se requiere una sola réplica de la web de revisión.')
    d.require(c.get('User') == '1000:1000' and c.get('ReadOnly') is True
              and 'ALL' in c.get('CapabilityDrop', []), 'Aislamiento web inesperado.')
    mounts = c.get('Mounts', [])
    sources = {m['Source'] for m in mounts if m['Type'] == 'volume'}
    d.require(sources in ({d.IPC, d.VIDEO}, {d.IPC, d.VIDEO, VOLUME}),
              'Hay volúmenes web desconocidos; no se modifican.')
    expected = {d.IPC: ('/run/office', True), d.VIDEO: ('/data/video', False), VOLUME: (DIRECTORY, False)}
    for m in mounts:
        d.require(m['Type'] in ('volume', 'tmpfs'), 'Montaje web inesperado.')
        if m['Type'] == 'volume':
            target, readonly = expected[m['Source']]
            d.require(m['Target'] == target and bool(m.get('ReadOnly')) == readonly, 'Destino de volumen inesperado.')
    limits = spec['TaskTemplate']['Resources']['Limits']
    d.require(limits.get('NanoCPUs') == 1000000000 and 0 < limits.get('MemoryBytes', 0) <= 768*1024**2,
              'Límites web inesperados.')
    d.require(not spec.get('EndpointSpec', {}).get('Ports'), 'La web publica puertos inesperados.')
    d.require(spec.get('Labels', {}).get('office.phase') == 'connected', 'Termina primero el despliegue de revisión.')
    d.require(all(not value.startswith(('ELEVENLABS_API_KEY=', 'OPENAI_API_KEY=', 'ANTHROPIC_API_KEY='))
                  for value in c.get('Env', [])), 'Hay claves inline inesperadas; no se muestran ni se modifican.')


def prepare_storage():
    volume_exists = VOLUME in d.ids('volume')
    key_exists = KEY in d.ids('secret')
    for kind, name, exists in [('volume', VOLUME, volume_exists), ('secret', KEY, key_exists)]:
        if exists:
            d.require(d.owned(d.inspect(kind, name)), 'Colisión con un recurso ajeno: ' + name)
    d.require(not volume_exists or key_exists, 'Existe almacenamiento sin su llave maestra. No se reemplaza ni se borra.')
    if not key_exists:
        # Binary secret through stdin only: no terminal output, shell or environment.
        result = subprocess.run(['docker', 'secret', 'create', '--label', d.LABEL, KEY, '-'],
                                input=secrets.token_bytes(32), capture_output=True, timeout=30)
        d.require(result.returncode == 0, 'No se pudo crear el secreto de cifrado.')
    if not volume_exists:
        d.docker('volume', 'create', '--label', d.LABEL, VOLUME)
    # Only the new dedicated volume. Never mounts the login, videos or Docker socket.
    code = """const fs=require('fs');const dir='/private';const s=fs.statSync(dir);if(s.uid===1000&&(s.mode&0o077)===0)process.exit(0);const names=fs.readdirSync(dir);if(names.length===0){fs.chownSync(dir,1000,1000);fs.chmodSync(dir,0o700)}else if(s.uid!==1000||(s.mode&0o077)!==0){process.exit(1)}"""
    d.docker('run', '--rm', '--network', 'none', '--read-only', '--user', '0:0',
             '--cpus', '0.1', '--memory', '64m', '--pids-limit', '32',
             '--cap-drop', 'ALL', '--cap-add', 'CHOWN', '--cap-add', 'FOWNER',
             '--security-opt', 'no-new-privileges', '--mount', 'type=volume,src='+VOLUME+',dst=/private',
             d.IMAGE, 'node', '-e', code)


def extra_cpu_margin():
    total = 1.0  # Existing one-CPU private Codex worker, checked by d.preflight.
    for name in d.ids('service'):
        if 'oficina' not in name:
            continue
        spec = d.inspect('service', name)['Spec']
        limit = spec['TaskTemplate'].get('Resources', {}).get('Limits', {}).get('NanoCPUs', 0)
        d.require(limit > 0, 'Un servicio de oficina no tiene límite verificable.')
        total += limit/1e9 * spec.get('Mode', {}).get('Replicated', {}).get('Replicas', 1)
    d.require(total + .1 <= 5, 'Sin margen para inicializar conexiones dentro de 5 CPU.')


def main():
    files = source_files()
    _, original, existing = d.preflight()
    validate_web(existing)
    extra_cpu_margin()
    previous_marker = existing['Spec']['Labels'].get('office.deployment-marker')
    d.wait_https(previous_marker, bootstrap=False)
    password = d.password_from(original)
    # Private backup of the actual spec. No credential is printed.
    backup_dir = Path(tempfile.mkdtemp(prefix='oficina-review-backup-', dir=Path.home()))
    backup = backup_dir/'service.json'
    fd = os.open(backup, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'w') as output:
        json.dump(existing, output)
    d.emit(step='backup', file=str(backup))
    prepare_storage()
    marker = hashlib.sha256(''.join(checksum for _, _, checksum in files).encode()).hexdigest()[:32]
    args = ['service', 'update', '--detach=true', '--update-order', 'stop-first',
            '--update-failure-action', 'rollback', '--update-monitor', '30s']
    container = existing['Spec']['TaskTemplate']['ContainerSpec']
    current = {x['File']['Name']: x for x in container.get('Configs', [])}
    for relative, file, checksum in files:
        name = 'office-review-web-' + checksum[:24]
        if name not in d.ids('config'):
            d.docker('config', 'create', '--label', d.LABEL, name, str(file))
        config = d.inspect('config', name)
        d.require(d.owned(config), 'Config ajeno; no se adopta.')
        d.require(hashlib.sha256(base64.b64decode(config['Spec']['Data'])).hexdigest() == checksum,
                  'El contenido del config no coincide con el archivo verificado.')
        target = '/app/' + relative
        prior = current.get(target)
        if prior and prior.get('ConfigName') == name:
            continue
        if prior:
            args += ['--config-rm', prior['ConfigID']]
        args += ['--config-add', 'source='+name+',target='+target+',uid=1000,gid=1000,mode=0444']
    if VOLUME not in {m.get('Source') for m in container.get('Mounts', [])}:
        args += ['--mount-add', 'type=volume,source='+VOLUME+',target='+DIRECTORY]
    present = [s for s in container.get('Secrets', []) if s['File']['Name'] == KEY_TARGET]
    if present:
        d.require(len(present) == 1 and present[0].get('SecretName') == KEY
                  and present[0]['File'].get('UID') == '1000' and present[0]['File'].get('Mode') == 256,
                  'El secreto configurado no coincide; no se reemplaza.')
    else:
        args += ['--secret-add', 'source='+KEY+',target='+KEY_TARGET+',uid=1000,gid=1000,mode=0400']
    for value in ['OFFICE_ENABLE_CONNECTION_SETTINGS=1', 'OFFICE_CONNECTIONS_DIR='+DIRECTORY,
                  'OFFICE_CONNECTIONS_KEY_FILE=/run/secrets/'+KEY_TARGET,
                  'OFFICE_DEPLOYMENT_MARKER='+marker]:
        args += ['--env-add', value]
    args += ['--label-add', 'office.deployment-marker='+marker, d.SERVICE]
    d.resource_check()
    d.require(d.inspect('service', d.SERVICE)['Version']['Index'] == existing['Version']['Index'],
              'La web cambió durante la preparación. Revisa antes de volver a ejecutar.')
    d.emit(step='update', message='Actualizando únicamente la web de revisión; se conserva su acceso y los videos.')
    d.docker(*args)
    d.wait_https(marker, bootstrap=False)
    after = d.inspect('service', d.SERVICE)
    validate_web(after)
    d.require(after['Spec']['TaskTemplate']['Networks'] == existing['Spec']['TaskTemplate']['Networks'], 'La red cambió inesperadamente.')
    d.require({k:v for k,v in after['Spec']['Labels'].items() if k.startswith('traefik.')} ==
              {k:v for k,v in existing['Spec']['Labels'].items() if k.startswith('traefik.')}, 'La ruta cambió inesperadamente.')
    state = d.request('/api/connections', password)
    d.require(state.get('available') is True and state.get('elevenlabs', {}).get('generationEnabled') is False,
              'La web no confirma el almacenamiento de claves.')
    d.emit(ok=True, url=d.ORIGIN+'/#/conexiones', connectionsAvailable=True,
           configured=state['elevenlabs']['configured'], inferencePerformed=False,
           voiceGenerated=False, published=False,
           message='Ingresa la API key solo en la pantalla Conexiones de la oficina.')


if __name__ == '__main__':
    try:
        main()
    except d.DeploymentError as error:
        d.emit(ok=False, error=str(error), resourcesPreserved=True)
        sys.exit(1)
    except KeyboardInterrupt:
        d.emit(ok=False, error='Interrumpido; los recursos se conservan.', resourcesPreserved=True)
        sys.exit(130)
    except Exception:
        d.emit(ok=False, error='Actualización interrumpida. Conserva la salida y revisa el servicio; no se muestran secretos.', resourcesPreserved=True)
        sys.exit(1)

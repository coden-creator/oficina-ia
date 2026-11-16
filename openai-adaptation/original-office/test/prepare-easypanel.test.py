"""Offline host-migration checks: Docker/TLS/provider operations are mocked."""
import base64
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from contextlib import ExitStack
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('handoff', Path(__file__).resolve().parents[1]/'scripts/prepare-easypanel-app.py')
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


def services():
    original = {'Version': {'Index': 4}, 'Spec': {'Name': app.d.ORIGINAL,
        'Mode': {'Replicated': {'Replicas': 1}}, 'TaskTemplate': {
            'Resources': {'Limits': {'NanoCPUs': 1000000000, 'MemoryBytes': 512*1024**2}},
            'ContainerSpec': {'Env': []}, 'Networks': [{'Target': 'project-network'}]}}}
    review = copy.deepcopy(original)
    review['Version']['Index'] = 7
    review['Spec'].update({'Name': app.d.SERVICE, 'Labels': {'office.purpose': app.d.PURPOSE}})
    review['Spec']['TaskTemplate']['ContainerSpec'] = {
        'Image': app.d.IMAGE, 'User': '1000:1000', 'ReadOnly': True, 'CapabilityDrop': ['ALL'],
        'Mounts': [{'Type': 'volume', 'Source': app.d.VIDEO, 'Target': '/data/video'},
                   {'Type': 'volume', 'Source': app.d.IPC, 'Target': '/run/office', 'ReadOnly': True}]}
    return original, review


class HandoffTests(unittest.TestCase):
    def test_fixed_route_cannot_administer_host_or_read_private_volumes(self):
        args = app.fixed_route_spec('node-fixture', 'config-fixture')
        self.assertEqual(args[:3], ['service', 'create', '--detach=true'])
        self.assertEqual(args[args.index('--name')+1], app.GATEWAY)
        self.assertIn('--read-only', args)
        self.assertEqual(args[args.index('--limit-cpu')+1], '0.1')
        self.assertEqual(args[-3:], [app.d.IMAGE, 'node', '/app/managed-route.mjs'])
        for forbidden in ['--mount', '--secret', '--publish', '--privileged', 'docker.sock', app.d.IPC, app.d.VIDEO]:
            self.assertNotIn(forbidden, ' '.join(args))
        self.assertIn(f'Host(`{app.APP_HOST}`) || Host(`{app.d.HOST}`)', ' '.join(args))

    def test_unknown_mounts_ports_resources_and_networks_fail_closed(self):
        original, review = services()
        network = {'Driver': 'overlay', 'Scope': 'swarm', 'Id': 'project-network'}
        with patch.object(app.d, 'inspect', return_value=network):
            app.validate_targets(original, review)
            for mutate in ['socket', 'cpu', 'port', 'network', 'readwrite']:
                a, r = copy.deepcopy(original), copy.deepcopy(review)
                if mutate == 'socket': r['Spec']['TaskTemplate']['ContainerSpec']['Mounts'].append({'Type': 'bind', 'Source': '/var/run/docker.sock', 'Target': '/docker.sock'})
                if mutate == 'cpu': a['Spec']['TaskTemplate']['Resources']['Limits']['NanoCPUs'] = 5000000000
                if mutate == 'port': a['Spec']['EndpointSpec'] = {'Ports': [3000]}
                if mutate == 'network': a['Spec']['TaskTemplate']['Networks'] = []
                if mutate == 'readwrite': r['Spec']['TaskTemplate']['ContainerSpec']['Mounts'][1]['ReadOnly'] = False
                with self.assertRaises(app.d.DeploymentError): app.validate_targets(a, r)

    def test_capacity_includes_route_and_temporary_key_copy(self):
        service = {'Spec': {'TaskTemplate': {'Resources': {'Limits': {'NanoCPUs': 3900000000}}}, 'Mode': {'Replicated': {'Replicas': 1}}}}
        with patch.object(app.d, 'ids', return_value=['oficina_other']), patch.object(app.d, 'inspect', return_value=service):
            with self.assertRaises(app.d.DeploymentError): app.cpu_margin()
            service['Spec']['TaskTemplate']['Resources']['Limits']['NanoCPUs'] = 3700000000
            app.cpu_margin()

    def test_connections_without_original_key_are_not_rekeyed(self):
        with patch.object(app.d, 'ids', side_effect=lambda kind: [app.CONNECTIONS] if kind == 'volume' else []), patch.object(app, 'initialize_private_volume') as initialize:
            with self.assertRaises(app.d.DeploymentError): app.prepare_connections('fixture')
            initialize.assert_not_called()

    def test_existing_private_key_is_checked_never_regenerated(self):
        with patch.object(app.d, 'ids', side_effect=lambda kind: [app.CONNECTIONS, app.KEY_VOLUME] if kind == 'volume' else []), patch.object(app, 'initialize_private_volume'), patch.object(app.d, 'docker') as docker:
            app.prepare_connections('fixture')
            self.assertEqual(docker.call_count, 1)
            self.assertNotIn('randomBytes', str(docker.call_args))
            self.assertIn('readonly', str(docker.call_args))

    def test_origin_tls_connects_to_node_with_public_sni_and_no_authentication(self):
        from unittest.mock import MagicMock
        context=MagicMock();connection=MagicMock();response=connection.getresponse.return_value
        response.status=200;response.read.return_value=b'{"version":"easypanel-app-route-v1"}'
        with patch.object(app.d,'inspect',return_value={'Status':{'Addr':'192.0.2.44'}}), \
             patch.object(app.ssl,'create_default_context',return_value=context), \
             patch.object(app.socket,'create_connection') as socket, \
             patch.object(app.http.client,'HTTPSConnection',return_value=connection):
            self.assertTrue(app.route_ready())
            socket.assert_called_once_with(('192.0.2.44',443),timeout=10)
            context.wrap_socket.assert_called_once_with(socket.return_value,server_hostname=app.APP_HOST)
            connection.request.assert_called_once_with('GET','/office-route-health')

    def test_resume_checks_state_without_enabling_old_writer(self):
        with tempfile.TemporaryDirectory() as folder:
            state=Path(folder)/'state.json';app.private_json(state,{'backup':folder,'routeDigest':'fixture'})
            gateway={'Spec':{'Labels':{'office.purpose':app.PURPOSE},'Mode':{'Replicated':{'Replicas':1}}}}
            review={'Spec':{'Labels':{'office.purpose':app.d.PURPOSE},'Mode':{'Replicated':{'Replicas':0}}}}
            worker={'State':{'Health':{'Status':'healthy'}}}
            def inspect(kind,name):return {app.GATEWAY:gateway,app.d.SERVICE:review,app.d.WORKER:worker}[name]
            with patch.object(app,'STATE',state),patch.object(app.d,'inspect',side_effect=inspect), \
                 patch.object(app.d,'limits_ok',return_value=True),patch.object(app,'wait_route'), \
                 patch.object(app,'output_handoff') as output,patch.object(app.d,'docker') as docker:
                app.resume_handoff('fixture');output.assert_called_once_with(folder);docker.assert_not_called()
                review['Spec']['Mode']['Replicated']['Replicas']=1
                with self.assertRaises(app.d.DeploymentError):app.resume_handoff('fixture')

    def transaction(self, failure=None):
        with tempfile.TemporaryDirectory() as folder, ExitStack() as stack:
            root = Path(folder); backup = root/'backup'; backup.mkdir()
            original, review = services(); payload=b'fixed-route-fixture'; digest=hashlib.sha256(payload).hexdigest()
            config={'Spec': {'Labels': {'office.purpose': app.PURPOSE}, 'Data': base64.b64encode(payload).decode()}}
            def inspect(kind, name):
                if kind == 'config': return config
                if name == app.d.ORIGINAL: return original
                if name == app.d.SERVICE: return review
                if name == app.GATEWAY: return {'Spec': {'Labels': {'office.purpose': app.PURPOSE}}}
                raise AssertionError((kind, name))
            stack.enter_context(patch.object(app, 'STATE', root/'state.json'))
            stack.enter_context(patch.object(app, 'checked_source', return_value=(root/'route.mjs', digest)))
            stack.enter_context(patch.object(app.d, 'preflight', return_value=('node', original, review)))
            stack.enter_context(patch.object(app, 'validate_targets'))
            stack.enter_context(patch.object(app, 'cpu_margin'))
            stack.enter_context(patch.object(app.tempfile, 'mkdtemp', return_value=str(backup)))
            stack.enter_context(patch.object(app.d, 'ids', side_effect=lambda kind: ['office-managed-route-'+digest[:24]] if kind == 'config' else []))
            stack.enter_context(patch.object(app.d, 'inspect', side_effect=inspect))
            stack.enter_context(patch.object(app.d, 'emit'))
            events=[]
            docker=stack.enter_context(patch.object(app.d, 'docker', side_effect=lambda *args, **kwargs: events.append(args) or ''))
            stack.enter_context(patch.object(app, 'wait_route', side_effect=app.d.DeploymentError('TLS') if failure=='tls' else None))
            stack.enter_context(patch.object(app, 'no_running_jobs'))
            stack.enter_context(patch.object(app, 'backup_volume', side_effect=lambda *args: events.append(('backup', args[0]))))
            stack.enter_context(patch.object(app, 'prepare_connections', side_effect=app.d.DeploymentError('key') if failure=='key' else None))
            stack.enter_context(patch.object(app.d, 'resource_check'))
            stack.enter_context(patch.object(app, 'output_handoff'))
            if failure:
                with self.assertRaises(app.d.DeploymentError): app.main()
                self.assertFalse(app.STATE.exists())
            else:
                app.main()
                self.assertEqual(json.loads(app.STATE.read_text())['phase'], 'ready-for-easypanel')
                self.assertEqual((backup/'app-service.json').stat().st_mode & 0o777, 0o600)
                self.assertEqual((backup/'review-service.json').stat().st_mode & 0o777, 0o600)
            return events

    def test_success_stops_old_writer_before_consistent_video_backup(self):
        events=self.transaction()
        stop=('service','scale','--detach=true',app.d.SERVICE+'=0')
        self.assertLess(events.index(stop), events.index(('backup', app.d.VIDEO)))
        self.assertFalse(any(e[:2]==('service','rm') for e in events))
        self.assertFalse(any(app.d.WORKER in str(e) for e in events))

    def test_tls_failure_removes_only_new_route_without_stopping_old_web(self):
        events=self.transaction('tls')
        self.assertIn(('service','rm',app.GATEWAY), events)
        self.assertFalse(any(e[:2]==('service','scale') for e in events))

    def test_late_failure_restores_old_writer_and_keeps_backups(self):
        events=self.transaction('key')
        self.assertIn(('service','scale','--detach=true',app.d.SERVICE+'=1'), events)
        self.assertIn(('service','rm',app.GATEWAY), events)
        self.assertFalse(any('volume' in e[:1] for e in events))


if __name__ == '__main__':
    unittest.main()

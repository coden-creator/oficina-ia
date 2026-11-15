"""Offline deployment checks. All Docker/provider calls are mocked."""
import copy
import importlib.util
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('update_connections', Path(__file__).resolve().parents[1]/'scripts/update-review-connections.py')
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


def service():
    return {'Spec': {'Name': app.d.SERVICE, 'Labels': {'office.purpose': app.d.PURPOSE, 'office.phase': 'connected'},
                    'Mode': {'Replicated': {'Replicas': 1}}, 'TaskTemplate': {
                        'Resources': {'Limits': {'NanoCPUs': 1000000000, 'MemoryBytes': 768*1024**2}},
                        'ContainerSpec': {'Image': app.d.IMAGE, 'User': '1000:1000', 'ReadOnly': True, 'CapabilityDrop': ['ALL'],
                                          'Mounts': [{'Type': 'volume', 'Source': app.d.IPC, 'Target': '/run/office', 'ReadOnly': True},
                                                     {'Type': 'volume', 'Source': app.d.VIDEO, 'Target': '/data/video'}]}}}}


class ConnectionsUpdateTests(unittest.TestCase):
    def test_accepts_only_expected_private_web_before_and_after(self):
        web = service()
        app.validate_web(web)
        web['Spec']['TaskTemplate']['ContainerSpec']['Mounts'].append({'Type': 'volume', 'Source': app.VOLUME, 'Target': app.DIRECTORY})
        app.validate_web(web)
        for change in ['image', 'mount', 'readonly', 'replicas', 'ports', 'secret_env']:
            changed = copy.deepcopy(web)
            c = changed['Spec']['TaskTemplate']['ContainerSpec']
            if change == 'image': c['Image'] = 'unverified:latest'
            if change == 'mount': c['Mounts'].append({'Type': 'bind', 'Source': '/var/run/docker.sock', 'Target': '/docker'})
            if change == 'readonly': c['Mounts'][0]['ReadOnly'] = False
            if change == 'replicas': changed['Spec']['Mode']['Replicated']['Replicas'] = 2
            if change == 'ports': changed['Spec']['EndpointSpec'] = {'Ports': [3000]}
            if change == 'secret_env': c['Env'] = ['ELEVENLABS_API_KEY=synthetic']
            with self.assertRaises(app.d.DeploymentError): app.validate_web(changed)

    def test_storage_missing_master_is_preserved_not_rotated(self):
        with patch.object(app.d, 'ids', side_effect=lambda kind: [app.VOLUME] if kind == 'volume' else []), \
             patch.object(app.d, 'inspect', return_value={'Labels': {'office.purpose': app.d.PURPOSE}}), \
             patch.object(app.subprocess, 'run') as run, patch.object(app.d, 'docker') as docker:
            with self.assertRaises(app.d.DeploymentError): app.prepare_storage()
            run.assert_not_called()
            docker.assert_not_called()

    def test_master_is_binary_stdin_and_only_new_volume_is_initialized(self):
        with patch.object(app.d, 'ids', return_value=[]), \
             patch.object(app.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)) as run, \
             patch.object(app.d, 'docker') as docker:
            app.prepare_storage()
            command = run.call_args.args[0]
            self.assertEqual(command[-2:], [app.KEY, '-'])
            self.assertEqual(len(run.call_args.kwargs['input']), 32)
            self.assertNotIn('shell', run.call_args.kwargs)
            self.assertEqual(docker.call_args_list[0].args, ('volume','create','--label',app.d.LABEL,app.VOLUME))
            init = docker.call_args_list[1].args
            self.assertIn('type=volume,src='+app.VOLUME+',dst=/private', init)
            self.assertNotIn(app.d.IPC, str(init))
            self.assertNotIn(app.d.VIDEO, str(init))
            self.assertNotIn('docker.sock', str(init))

    def test_existing_master_never_regenerated(self):
        with patch.object(app.d, 'ids', side_effect=lambda kind: [app.VOLUME] if kind == 'volume' else [app.KEY]), \
             patch.object(app.d, 'inspect', return_value={'Labels': {'office.purpose': app.d.PURPOSE},'Spec': {'Labels': {'office.purpose': app.d.PURPOSE}}}), \
             patch.object(app.subprocess, 'run') as run, patch.object(app.d, 'docker') as docker:
            app.prepare_storage()
            run.assert_not_called()
            self.assertEqual(docker.call_count, 1)
            self.assertEqual(docker.call_args.args[0], 'run')

    def test_checksum_manifest_covers_every_runtime_overlay(self):
        files = app.source_files()
        self.assertEqual(len(files), len(app.FILES))
        self.assertTrue(any(name == 'connections/store.mjs' for name, _, _ in files))


if __name__ == '__main__':
    unittest.main()

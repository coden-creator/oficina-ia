"""Offline tests: no Docker mutation, credentials, account or inference."""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import ssl
import unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location('deploy_review', Path(__file__).resolve().parents[1]/'scripts/deploy-review-office.py')
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)
PASSWORD = 'fixture-only-existing-password'
ORIGINAL = {'Spec':{'TaskTemplate':{'ContainerSpec':{'Env':['OFFICE_PASSWORD='+PASSWORD]}}}}
MARKER = 'a'*32


class ReviewDeploymentTests(unittest.TestCase):
    def test_bootstrap_contains_no_secret_session_or_storage(self):
        config = app.manifest('test-node', MARKER, bootstrap=True)
        service = config['services']['office']
        self.assertNotIn('secrets', config)
        self.assertNotIn('volumes', config)
        self.assertEqual(service['environment'], {'OFFICE_DEPLOYMENT_MARKER':MARKER})
        self.assertEqual(service['deploy']['labels']['traefik.swarm.network'], 'CodeNet')
        self.assertEqual(service['deploy']['placement']['constraints'], ['node.hostname == test-node'])

    def test_connected_web_shares_only_readonly_ipc_and_new_video_volume(self):
        config = app.manifest('test-node', MARKER)
        self.assertEqual(set(config['services']), {'office'})
        self.assertEqual(config['services']['office']['volumes'], ['video:/data/video','ipc:/run/office:ro'])
        self.assertEqual(config['volumes']['ipc']['name'], app.IPC)
        self.assertNotIn('oficina-jorge-codex-auth', json.dumps(config))
        self.assertNotIn('ports', config['services']['office'])

    def test_tls_failure_sends_no_http_request(self):
        connection = Mock()
        connection.connect.side_effect = ssl.SSLCertVerificationError('fixture certificate failure')
        with patch.object(app.http.client, 'HTTPSConnection', return_value=connection) as constructor:
            with self.assertRaises(ssl.SSLCertVerificationError):
                app.request('/api/config', PASSWORD)
        context = constructor.call_args.kwargs['context']
        self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)
        self.assertTrue(context.check_hostname)
        connection.request.assert_not_called()

    def test_redirect_is_rejected_without_following_it(self):
        connection = Mock()
        connection.getresponse.return_value.status = 302
        with patch.object(app.http.client, 'HTTPSConnection', return_value=connection):
            with self.assertRaisesRegex(app.DeploymentError, 'HTTP 302'):
                app.request('/health')
        self.assertEqual(connection.request.call_count, 1)

    def test_failed_https_never_provisions_or_reads_access_password(self):
        with patch.object(app, 'preflight', return_value=('test-node', ORIGINAL, None)), \
             patch.object(app, 'deploy') as deploy, \
             patch.object(app, 'wait_https', side_effect=app.DeploymentError('TLS pending')), \
             patch.object(app, 'password_from') as password, patch.object(app, 'docker') as docker, \
             patch.object(app.sys, 'argv', ['deploy']), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(app.DeploymentError):
                app.main()
            password.assert_not_called()
            docker.assert_not_called()
            self.assertNotIn('secrets', deploy.call_args.args[0])

    def test_rerun_connected_office_does_not_redeploy_or_run_inference(self):
        existing = {'Spec':{'Labels':{'office.phase':'connected','office.deployment-marker':MARKER}}}
        with patch.object(app, 'preflight', return_value=('test-node', ORIGINAL, existing)), \
             patch.object(app, 'wait_https'), patch.object(app, 'verify_web'), \
             patch.object(app, 'verify_connection'), patch.object(app, 'deploy') as deploy, \
             patch.object(app, 'docker') as docker, patch.object(app, 'test_video') as video, \
             patch.object(app.sys, 'argv', ['deploy']), contextlib.redirect_stdout(io.StringIO()):
            app.main()
            deploy.assert_not_called()
            docker.assert_not_called()
            video.assert_not_called()

    def test_new_deployment_secrets_use_stdin_and_only_named_new_resources(self):
        output = io.StringIO()
        with patch.object(app, 'preflight', return_value=('test-node', ORIGINAL, None)), \
             patch.object(app, 'wait_https'), patch.object(app, 'verify_web'), \
             patch.object(app, 'verify_connection'), patch.object(app, 'resource_check'), \
             patch.object(app, 'ids', return_value=[]), patch.object(app, 'deploy') as deploy, \
             patch.object(app, 'docker') as docker, patch.object(app.sys, 'argv', ['deploy']), \
             contextlib.redirect_stdout(output):
            app.main()
        self.assertEqual(deploy.call_count, 2)
        self.assertEqual(docker.call_count, 2)
        create_secret, create_volume = docker.call_args_list
        self.assertEqual(create_secret.args, ('secret','create','--label',app.LABEL,app.SECRET,'-'))
        self.assertEqual(create_secret.kwargs, {'data':PASSWORD})
        self.assertEqual(create_volume.args, ('volume','create','--label',app.LABEL,app.VIDEO))
        self.assertNotIn(PASSWORD, output.getvalue())

    def test_existing_incomplete_test_never_repeats_model_turns(self):
        job = {'id':'fixture-job','brief':{'objective':app.TEST_OBJECTIVE},'state':'blocked',
               'quality':{'technical':'not-verified'},'stages':[]}
        with patch.object(app, 'request', return_value=[job]) as request, \
             contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(app.DeploymentError):
                app.test_video(PASSWORD)
        request.assert_called_once_with('/api/video-workflows/glowfy', PASSWORD)

    def test_purpose_label_is_required_for_adoption(self):
        self.assertFalse(app.owned({'Spec':{'Labels':{}}}))
        self.assertFalse(app.owned({'Labels':{'office.purpose':'someone-else'}}))
        self.assertTrue(app.owned({'Labels':{'office.purpose':app.PURPOSE}}))

    def test_verified_worker_requires_effective_limits_and_security_flags(self):
        worker = {'Config':{'User':'1000:1000'},'HostConfig':{
            'NanoCpus':1000000000,'Memory':768*1024**2,'PidsLimit':128,
            'ReadonlyRootfs':True,'CapDrop':['ALL'],'SecurityOpt':['no-new-privileges:true']}}
        self.assertTrue(app.limits_ok(worker))
        worker['HostConfig']['PidsLimit'] = 0
        self.assertFalse(app.limits_ok(worker))

    def test_exact_bootstrap_marker_is_required(self):
        with patch.object(app, 'request', return_value={'credentialsConfigured':False,'deploymentMarker':'wrong'}), \
             patch.object(app.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(app.DeploymentError):
                app.wait_https(MARKER, bootstrap=True)

    def preflight_fixture(self, services=None, video=None):
        original = copy.deepcopy(ORIGINAL)
        original['Spec'].update({'Name':app.ORIGINAL,'Labels':{},'Mode':{'Replicated':{'Replicas':1}}})
        original['Spec']['TaskTemplate']['Resources'] = {'Limits':{'NanoCPUs':1000000000}}
        worker = {'State':{'Health':{'Status':'healthy'}},'Config':{'Labels':{'office.purpose':'jorge-codex-worker'}},
                  'Mounts':[{'Name':app.IPC,'Destination':'/run/office'}],'Image':'fixture-image'}
        records = {('node','self'):{'Status':{'State':'ready'},'Spec':{'Availability':'active'},'Description':{'Hostname':'fixture-node'}},
                   ('network','CodeNet'):{'Driver':'overlay','Scope':'swarm','Attachable':False},
                   ('container',app.WORKER):worker,('image',app.IMAGE):{'Id':'fixture-image'},
                   ('volume',app.IPC):{},('service',app.ORIGINAL):original}
        for service in services or []:
            records['service',service['Spec']['Name']] = service
        if video is not None:
            records['volume',app.VIDEO] = video
        with patch.object(app, 'docker', return_value=json.dumps({'LocalNodeState':'active','ControlAvailable':True})), \
             patch.object(app, 'inspect', side_effect=lambda kind,name:records[kind,name]), \
             patch.object(app, 'ids', side_effect=lambda kind:[name for k,name in records if k == kind]), \
             patch.object(app, 'limits_ok', return_value=True), patch.object(app, 'resource_check'):
            return app.preflight()

    def test_nonattachable_overlay_is_supported(self):
        node, _, existing = self.preflight_fixture()
        self.assertEqual(node, 'fixture-node')
        self.assertIsNone(existing)

    def test_unowned_existing_stack_is_refused(self):
        service = {'Spec':{'Name':app.SERVICE,'Labels':{}}}
        with self.assertRaisesRegex(app.DeploymentError, 'stack ajeno'):
            self.preflight_fixture(services=[service])

    def test_hostname_collision_is_refused(self):
        service = {'Spec':{'Name':'unrelated','Labels':{'traefik.http.routers.other.rule':'Host(`'+app.HOST+'`)'}}}
        with self.assertRaisesRegex(app.DeploymentError, 'dominio de revisión'):
            self.preflight_fixture(services=[service])

    def test_existing_unowned_video_volume_is_refused(self):
        with self.assertRaisesRegex(app.DeploymentError, 'Recurso existente ajeno'):
            self.preflight_fixture(video={'Labels':{}})


if __name__ == '__main__':
    unittest.main()

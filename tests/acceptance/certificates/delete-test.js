import Ember from 'ember';
import {module, test} from 'qunit';
import startApp from '../../helpers/start-app';
import { stubRequest } from '../../helpers/fake-server';

let App;
let stackId = 'my-stack-1';
let orgId = 1;
let url = `/stacks/${stackId}/certificates`;

function stubCertificatesAndVhosts() {
  stubRequest('get', `/accounts/${stackId}/certificates`, function(){
    return this.success({
      _links: {},
      _embedded: {
        certificates: [
          { id: 'cert-1', certificate_body: 'cert_body', private_key: 'private_key',
            common_name: 'common_name',
            _links: { vhosts: { href: '/certificates/cert-1/vhosts' } } },
          { id: 'cert-2', certificate_body: 'cert_body2', private_key: 'private_key2',
            common_name: 'common_name2' }
        ]
      }
    });
  });

  stubRequest('get', '/certificates/cert-1/vhosts', function() {
    return this.success({
      _links: {},
      _embedded: {
        vhosts: [ { id: 'cert-1', virtual_domain: 'common_name' } ]
      }
    });
  });
}

module('Acceptance: Certificate Delete', {
  beforeEach: function() {
    App = startApp();
    let stack = {
      id: stackId,
      handle: stackId,
      _links: {
        certificates: { href: `/accounts/${stackId}/certificates` },
        organization: { href: `/organizations/${orgId}` }
      }
    };
    stubStacks({}, [stack]);
    stubOrganization();
    stubOrganizations();
    stubCertificatesAndVhosts();
  },
  afterEach: function() {
    Ember.run(App, 'destroy');
  }
});

test("certificates with attached vhosts disable delete button", function(assert) {
  signInAndVisit(url);

  andThen(function() {
    assert.ok(find('.panel.certificate:first .btn:contains(Delete):disabled').length,
              'first certificate can not be deleted');
    assert.ok(!!find('.panel.certificate:first .vhosts-count .resource-metadata-value:contains(1)'),
              'first certificate has 1 vhost');
    assert.ok(!!find('.panel.certificate:last .btn:contains(Delete)').length,
              'last certificate can be deleted');
  });
});

test(`visiting ${url} and deleting a certificate should delete the certificate`, function(assert) {
  let didDelete = false;

  stubRequest('delete', '/certificates/cert-2', function() {
    didDelete = true;
    return this.noContent();
  });

  signInAndVisit(url);
  andThen(function() {
    let deleteButton = find('button:contains(Delete)');
    // Clobber window confirm to accept delete.
    window.confirm = () => { return true; };
    deleteButton.click();
  });

  andThen(function() {
    assert.ok(didDelete, 'certificate was deleted');
    assert.equal(currentPath(), 'dashboard.stack.certificates.index');
  });

});

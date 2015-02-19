import Ember from 'ember';
import { locationHistory } from '../../utils/location';
import { titleHistory } from '../../utils/title-route-extensions';
import { stubRequest } from "./fake-server";

Ember.Test.registerAsyncHelper('signIn', function(app){
  var session = app.__container__.lookup('torii:session');
  var sm = session.get('stateMachine');

  Ember.run(function(){
    var store = app.__container__.lookup('store:main');
    var user = store.push('user', {
      id: 'user1',
      name: 'stubbed user',
      email: 'stubbed-user@gmail.com',
      links: { sshKeys: '/users/user1/ssh_keys' }
    });
    sm.transitionTo('authenticated');
    session.set('content.currentUser', user);
  });
});

Ember.Test.registerAsyncHelper('signInAndVisit', function(app, url){
  signIn();
  visit(url);
});

Ember.Test.registerAsyncHelper('expectRequiresAuthentication', function(app, url){
  visit(url);

  andThen(function(){
    equal(currentPath(), 'login');
  });
});

Ember.Test.registerAsyncHelper('locationUpdatedTo', function(app, url){
  equal(locationHistory.last, url, 'window.location updated to expected URL');
});

Ember.Test.registerAsyncHelper('titleUpdatedTo', function(app, title){
  equal(titleHistory.last, title, 'window.document.title updated to expected title');
});

Ember.Test.registerAsyncHelper('clickNextPageLink', function(app){
  click('.pager .next a');
});

Ember.Test.registerAsyncHelper('clickPrevPageLink', function(app){
  click('.pager .previous a');
});

Ember.Test.registerHelper('expectPaginationElements', function(app, options){
  options = options || {};

  var pagination = find('.pager');
  ok(pagination.length, 'has pagination');

  // var currentPage = options.currentPage || 1;
  // var currentPageEl = find('.current:contains('+currentPage+')', pagination);
  // ok(currentPageEl.length, 'has current page: '+currentPage);

  var prevPage = find('.previous', pagination);
  if (options.prevEnabled){
    ok(prevPage.length, 'visible previous div');
  } else {
    ok(prevPage.length === 0, 'hidden previous div');
  }

  var nextPage = find('.next', pagination);
  if (options.nextDisabled){
    ok(nextPage.length === 0, 'hidden next page div');
  } else {
    ok(nextPage.length, 'visible next page div');
  }
});

Ember.Test.registerHelper('equalElementText', function(app, node, expectedText){
  equal(node.text().trim(), expectedText, "Element's text did not match expected value");
});

Ember.Test.registerHelper('elementTextContains', function(app, node, expectedText){
  var nodeText = node.text();
  ok( nodeText.indexOf(expectedText) !== -1,
      "Element's text did not match expected value, was: '"+nodeText+"'" );
});

Ember.Test.registerHelper('stubStack', function(app, stackData){
  var id = stackData.id;
  if (!id) { throw new Error('cannot stub stack without id'); }

  stubRequest('get', '/accounts/' + id, function(request){
    return this.success(stackData);
  });
});

Ember.Test.registerHelper('stubApp', function(app, appData){
  var id = appData.id;
  if (!id) { throw new Error('cannot stub app without id'); }

  stubRequest('get', '/apps/' + id, function(request){
    return this.success(appData);
  });
});

Ember.Test.registerHelper('stubDatabase', function(app, databaseData){
  var id = databaseData.id;
  if (!id) { throw new Error('cannot stub database without id'); }

  stubRequest('get', '/databases/' + id, function(request){
    return this.success(databaseData);
  });
});

Ember.Test.registerHelper('stubStacks', function(app, options, stacks){
  if (!options) { options = {}; }
  if (options.includeApps === undefined) {
    options.includeApps = true;
  }
  if (options.includeDatabases === undefined) {
    options.includeDatabases = true;
  }

  stacks = stacks || [{
    _links: {
      self: { href: '...' },
      apps: { href: '/accounts/my-stack-1/apps' },
      databases: { href: '/accounts/my-stack-1/databases' },
      organization: { href: '/organizations/1' }
    },
    _embedded: {},
    id: 'my-stack-1',
    handle: 'my-stack-1'
  }, {
    _links: {
      self: { href: '...' },
      apps: { href: '/accounts/my-stack-2/apps' },
      databases: { href: '/accounts/my-stack-2/databases' },
      organization: { href: '/organizations/1' }
    },
    _embedded: {},
    id: 'my-stack-2',
    handle: 'my-stack-2'
  }];

  if (options.logDrains) {
    stacks[0]._embedded.log_drains = options.logDrains;
  }

  stubRequest('get', '/accounts', function(request){
    return this.success({
      _links: {},
      _embedded: {
        accounts: stacks
      }
    });
  });

  if (options.includeDatabases) {
    stubRequest('get', '/accounts/my-stack-1/databases', function(request){
      return this.success({
        _links: {},
        _embedded: {
          databases: [{
            id: 1,
            handle: 'my-db-1-stack-1'
          }, {
            id: 2,
            handle: 'my-db-2-stack-1'
          }]
        }
      });
    });
    stubRequest('get', '/accounts/my-stack-2/databases', function(request){
      return this.success({
        _links: {},
        _embedded: {
          databases: [{
            id: 3,
            handle: 'my-db-1-stack-2'
          }, {
            id: 4,
            handle: 'my-db-2-stack-2'
          }]
        }
      });
    });
  }

  if (options.includeApps) {
    stubRequest('get', '/accounts/my-stack-1/apps', function(request){
      return this.success({
        _links: {},
        _embedded: {
          apps: [{
            id: 1,
            handle: 'my-app-1-stack-1',
            status: 'provisioned',
            _embedded: {
              services: [{
                id: '1',
                handle: 'the-service',
                container_count: 1
              }]
            }
          }, {
            id: 2,
            handle: 'my-app-2-stack-1',
            status: 'provisioned',
            _embedded: {
              services: [{
                id: '2',
                handle: 'the-service-2',
                container_count: 1
              }]
            }
          }]
        }
      });
    });
    stubRequest('get', '/accounts/my-stack-2/apps', function(request){
      return this.success({
        _links: {},
        _embedded: {
          apps: [{
            id: 3,
            handle: 'my-app-1-stack-2',
            status: 'provisioned',
            _embedded: {
              services: []
            }
          }, {
            id: 4,
            handle: 'my-app-2-stack-2',
            status: 'provisioned',
            _embedded: {
              services: []
            }
          }]
        }
      });
    });
  }
});

Ember.Test.registerHelper('expectStackHeader', function(app, stackHandle){
  var handle = find('header .account-handle:contains(' + stackHandle + ')');
  ok(handle.length, 'expected stack header with handle: ' + stackHandle);
});

Ember.Test.registerHelper('stubOrganizations', function(app){
  stubRequest('get', '/organizations', function(request){
    return this.success({
      _links: {},
      _embedded: {
        organizations: [{
          _links: {
          },
          id: 1,
          name: 'Sprocket Co',
          type: 'organization'
        }]
      }
    });
  });
});

Ember.Test.registerHelper('stubOrganization', function(app, id){
  id = id || 1;
  stubRequest('get', '/organizations/'+id, function(request){
    return this.success({
      _links: {
      },
      id: id,
      name: 'Sprocket Co',
      type: 'organization'
    });
  });
});

Ember.Test.registerAsyncHelper('slideNoUISlider', function(app, selector, value){
  var element = $(selector);
  if (element && element.length) {
    element.trigger('slide', value);
  }
});

Ember.Test.registerAsyncHelper('setNoUISlider', function(app, selector, value){
  var element = $(selector);
  if (element && element.length) {
    element.trigger('set', value);
  }
});

Ember.Test.registerHelper('expectLink', function(app, link, options) {
  let contextEl = (options || {}).context;
  let selector = `*[href*="${link}"]`;
  let linkEl;
  if (contextEl) {
    linkEl = contextEl.find(selector);
  } else {
    linkEl = find(selector);
  }

  if (linkEl.length) {
    ok(true, `Found link "${link}"`);
    return linkEl;
  } else {
    ok(false, `Did not find link "${link}"`);
  }
});

Ember.Test.registerHelper('expectNoLink', function(app, link, options) {
  let contextEl = (options || {}).context;
  let selector = `*[href*="${link}"]`;
  let linkEl;
  if (contextEl) {
    linkEl = contextEl.find(selector);
  } else {
    linkEl = find(selector);
  }

  if (linkEl.length) {
    ok(false, `Expected not to find link "${link}"`);
  } else {
    ok(true, `Did not find link "${link}"`);
  }
});

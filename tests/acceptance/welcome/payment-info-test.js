import Ember from 'ember';
import startApp from '../../helpers/start-app';
import { mockStripe } from '../../helpers/mock-stripe';
import { stubRequest } from "../../helpers/fake-server";

let application;
let oldCreateToken;
let url = '/welcome/first-app';

function visitPaymentInfoWithApp(options, userData){
  userData = userData || {};
  if (userData.verified === undefined) { userData.verified = false; }

  signInAndVisit(url, userData);
  andThen(function(){
    if (!options) { return clickButton('Skip this step'); }

    if (options.dbType){ click(`.${options.dbType} a`); }
    for (var prop in options){
      let dasherized = prop.dasherize();

      // db-type is a button, not a fillIn-able input
      if (dasherized === 'db-type') { continue; }
      fillInput(dasherized, options[prop]);
    }
    clickButton('Get Started');
  });
}

function mockSuccessfulPayment(stripeToken){
  mockStripe.card.createToken = function(options, fn) {
    setTimeout(function(){
      fn(200, { id: stripeToken || 'mocked-stripe-token' });
    }, 2);
  };
  stubRequest('post', '/organizations/:org_id/subscriptions', function(request){
    return this.success();
  });
}

module('Acceptance: WelcomePaymentInfo', {
  setup: function() {
    application = startApp();
    oldCreateToken = mockStripe.card.createToken;
  },
  teardown: function() {
    Ember.run(application, 'destroy');
    mockStripe.card.createToken = oldCreateToken;
  }
});

test('visiting /welcome/payment-info when not logged in', function() {
  expectRequiresAuthentication('/welcome/payment-info');
});

test('submitting empty payment info raises an error', function() {
  mockStripe.card.createToken = function(options, fn) {
    setTimeout(function(){
      fn(422, { error: { message: 'Failure' } });
    }, 2);
  };

  stubOrganizations();

  visitPaymentInfoWithApp();
  clickButton('Save');

  andThen(function() {
    equal(currentPath(), 'welcome.payment-info');
    let error = find('p:contains(Failure)');
    ok(error.length, 'errors are on the page');
  });
});

test('payment info should be submitted to stripe to create stripeToken', function() {
  expect(8);

  // This is to load apps.index
  stubStacks();
  stubOrganization();
  let cardOptions = {
    name: 'Bob Boberson',
    cardNumber: '4242424242424242',
    cvc: '123',
    expMonth: '03',
    expYear: '2019',
    addressZip: '11111'
  };
  let stripeToken = 'some-token';
  let stackHandle = 'sprocket-co';
  let appHandle = 'my-app-1';

  stubRequest('post', '/organizations/1/subscriptions', function(request){
    var params = this.json(request);
    equal(params.stripe_token, stripeToken, 'stripe token is submitted');
    return this.success();
  });

  let stackAssertions = {};

  stubRequest('post', '/accounts', function(request){
    return this.success({
      id: stackHandle,
      handle: stackHandle,
      type: 'development'
    });
  });

  stubOrganizations();

  mockStripe.card.createToken = function(options, fn) {
    equal(options.name, cardOptions.name, 'name is correct');
    equal(options.number, cardOptions.cardNumber, 'card number is correct');
    equal(options.cvc, cardOptions.cvc, 'cvc is correct');
    equal(options.exp_month, cardOptions.expMonth, 'exp month is correct');
    equal(options.exp_year, cardOptions.expYear, 'exp year is correct');
    equal(options.address_zip, cardOptions.addressZip, 'zip is correct');
    setTimeout(function(){
      fn(200, { id: stripeToken });
    }, 2);
  };

  visitPaymentInfoWithApp();
  fillInput('name', cardOptions.name);
  fillInput('number', cardOptions.cardNumber);
  fillInput('cvc', cardOptions.cvc);
  fillInput('exp-month', cardOptions.expMonth);
  fillInput('exp-year', cardOptions.expYear);
  fillInput('zip', cardOptions.addressZip);
  clickButton('Save');
  andThen( () => {
    equal(currentPath(), 'stacks.index');
  });
});

test('submitting valid payment info for development plan should create dev stack', function() {
  expect(4);

  // This is to load apps.index
  stubStacks();
  stubOrganization();

  let stackHandle = 'sprocket-co';
  let appHandle = 'my-app-1';

  let stackAssertions = {};

  stackAssertions[`${stackHandle}-dev`] = (params) => {
    ok(true, 'stack handle is correct');
    equal(params.organization_url, '/organizations/1', 'correct organization_url is posted');
    equal(params.type, 'development', 'stack type is correct');
    stackAssertions[params.handle] = null;
  };

  stackAssertions[`${stackHandle}-prod`] = (params) => {
    ok(false, 'should not create prod stack');
  };

  stubRequest('post', '/accounts', function(request){
    var params = this.json(request);
    stackAssertions[params.handle](params);

    return this.success(Ember.merge({id:params.handle},params));
  });

  stubOrganizations();
  mockSuccessfulPayment();

  visitPaymentInfoWithApp();
  fillInput('plan', 'development');
  clickButton('Save');
  andThen( () => {
    equal(currentPath(), 'stacks.index');
  });
});

test('submitting valid payment info for production plan should create dev and prod stacks', function() {
  expect(7);

  // This is to load apps.index
  stubStacks();
  stubOrganization();

  let stackHandle = 'sprocket-co';
  let appHandle = 'my-app-1';

  let stackAssertions = {};

  stackAssertions[`${stackHandle}-dev`] = (params) => {
    ok(true, 'stack handle is correct');
    equal(params.organization_url, '/organizations/1', 'correct organization_url is posted');
    equal(params.type, 'development', 'stack type is correct');
    stackAssertions[params.handle] = null;
  };

  stackAssertions[`${stackHandle}-prod`] = (params) => {
    ok(true, 'should create prod stack');
    equal(params.organization_url, '/organizations/1', 'correct organization_url is posted');
    equal(params.type, 'production', 'stack type is correct');
    stackAssertions[params.handle] = null;
  };

  stubRequest('post', '/accounts', function(request){
    var params = this.json(request);
    stackAssertions[params.handle](params);

    return this.success(Ember.merge({id:params.handle},params));
  });

  stubOrganizations();
  mockSuccessfulPayment();

  visitPaymentInfoWithApp();
  fillInput('plan', 'production');
  clickButton('Save');
  andThen( () => {
    equal(currentPath(), 'stacks.index');
  });
});

test('submitting valid payment info should create app', function() {
  expect(2);
  // This is to load apps.index
  stubStacks();
  stubOrganization();
  let stackHandle = 'sprocket-co';
  let appHandle = 'my-app-1';


  stubRequest('post', '/accounts', function(request){
    var params = this.json(request);
    return this.success(Ember.merge({id:params.handle}, params));
  });

  stubRequest('post', `/accounts/${stackHandle}-dev/apps`, function(request){
    var params = this.json(request);
    equal(params.handle, appHandle, 'app handle is correct');
    return this.success({id: appHandle, handle: appHandle});
  });

  stubOrganizations();
  mockSuccessfulPayment();

  visitPaymentInfoWithApp({appHandle: appHandle});
  clickButton('Save');
  andThen(function() {
    equal(currentPath(), 'stacks.index');
  });
});

test('submitting valid payment info should create db', function() {
  expect(3);

  // This is to load apps.index
  stubStacks();
  stubOrganization();
  let stackHandle = 'sprocket-co';
  let dbHandle = 'my-db-1';
  let dbType = 'redis';

  stubRequest('post', '/accounts', function(request){
    var params = this.json(request);
    return this.success(Ember.merge({id:params.handle}, params));
  });

  stubRequest('post', `/accounts/${stackHandle}-dev/databases`, function(request){
    var params = this.json(request);
    equal(params.handle, dbHandle, 'db handle is correct');
    equal(params.type, dbType, 'db type is correct');
    return this.success({id: dbHandle});
  });

  stubOrganizations();
  mockSuccessfulPayment();

  visitPaymentInfoWithApp({
    dbHandle: dbHandle,
    dbType: dbType
  });
  clickButton('Save');
  andThen(function() {
    equal(currentPath(), 'stacks.index');
  });
});

test('submitting valid payment info when user is verified should provision db', function() {
  expect(4);

  // This is to load apps.index
  stubStacks();
  stubOrganization();
  var stackHandle = 'sprocket-co';
  var dbHandle = 'my-db-1';
  var dbType = 'redis';
  let dbId = 'db-id';
  let opType = 'provision';

  let databaseParams = {};
  let operationsParams = {};

  stubRequest('post', '/accounts', function(request){
    let params = this.json(request);
    return this.success(Ember.merge({id:params.handle},params));
  });

  stubRequest('post', `/accounts/${stackHandle}-dev/databases`, function(request){
    databaseParams = this.json(request);
    return this.success({id: dbId});
  });

  // provisionDatabases must GET all dbs to provision them
  stubDatabases([{id:dbId}]);

  stubRequest('post', `/databases/${dbId}/operations`, function(request){
    operationsParams = this.json(request);
    return this.success(201, {id: 'op-id'});
  });

  stubOrganizations();
  mockSuccessfulPayment();

  let userData = {id: 'user-id', verified: true};
  visitPaymentInfoWithApp({
    dbHandle: dbHandle,
    dbType: dbType
  }, userData);
  clickButton('Save');
  andThen(function() {
    equal(currentPath(), 'stacks.index');

    equal(databaseParams.handle, dbHandle,
          'db params has handle');
    equal(databaseParams.type, dbType,
          'db params has type');
    equal(operationsParams.type, opType,
          'op params has type');
  });
});

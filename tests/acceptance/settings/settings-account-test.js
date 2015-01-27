import Ember from 'ember';
import startApp from '../../helpers/start-app';
import { stubRequest } from '../../helpers/fake-server';

var App;

var settingsUrl = '/settings';
var settingsAccountUrl = settingsUrl + '/admin';
var userId = 'user1'; // from signInAndVisit helper
var userEmail = 'stubbed-user@gmail.com'; // from signInAndVisit helper
var userName = 'stubbed user'; // from signInAndVisit helper

var userApiUrl = '/users/' + userId;

module('Acceptance: User Settings: Account', {
  setup: function() {
    App = startApp();
    stubStacks();
  },
  teardown: function() {
    Ember.run(App, 'destroy');
  }
});

test(settingsAccountUrl + ' requires authentication', function(){
  expectRequiresAuthentication(settingsAccountUrl);
});

test('visit ' + settingsAccountUrl + ' shows change password form', function(){
  signInAndVisit(settingsAccountUrl);

  andThen(function(){
    // change password

    ok( find('h3:contains(Change Your Password)').length,
        'has change password header' );

    ok( find('input[name="password"]').length,
        'has password input');

    ok( find('input[name="confirm-password"]').length,
        'has confirm password input');

    ok( find('button:contains(Change password)'),
        'has change password button');

  });
});

test('visit ' + settingsAccountUrl + ' shows change email form', function(){
  signInAndVisit(settingsAccountUrl);

  andThen(function(){
    // change email

    ok( find('h3:contains(Change Your Email)').length,
        'has change email header' );

    ok( find('input[name="email"]').length,
        'has email input');

    equal( find('input[name="email"]').val(), userEmail,
           'email input has user email value');

    ok( find('button:contains(Change email)'),
        'has change email button');
  });
});

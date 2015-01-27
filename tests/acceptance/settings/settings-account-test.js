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

    ok( find('button:contains(Change password)').length,
        'has change password button');

    ok(!find('input[name="current-password"]').length,
       'shows no current password input');

    click('button:contains(Change password)');
  });

  andThen(function(){
    ok(find('input[name="current-password"]').length,
       'shows current password input');
  });
});

test('visit ' + settingsAccountUrl + ' allows changing password', function(){
  expect(5);

  signInAndVisit(settingsAccountUrl);

  var newPassword = 'abcdefghi',
      oldPassword = 'defghiljk';

  stubRequest('put', 'users/user1', function(request){
    var user = JSON.parse(request.requestBody);

    equal(user.current_password, oldPassword);
    equal(user.password, newPassword);

    return this.success({
      id: 'user1',
      password: null
    });
  });

  andThen(function(){
    fillIn('input[name="password"]', newPassword );
    fillIn('input[name="confirm-password"]', newPassword );
    click('button:contains(Change password)');
  });

  andThen(function(){
    fillIn('input[name="current-password"]', oldPassword);
    click('button:contains(Change password)');
  });

  andThen(function(){
    ok( Ember.isBlank(find('input[name="password"]').val()),
        'password input is empty');
    ok( Ember.isBlank(find('input[name="confirm-password"]').val()),
        'password confirm input is empty');
    ok( !find('input[name="current-password"]').length,
        'current password input is not shown');
  });
});

test('visit ' + settingsAccountUrl + ' with errors', function(){
  expect(2);

  signInAndVisit(settingsAccountUrl);

  var newPassword = 'abcdefghi',
      oldPassword = 'defghiljk';

  stubRequest('put', 'users/user1', function(request){
    var user = JSON.parse(request.requestBody);

    return this.error({
      code: 401,
      error: 'invalid_credentials',
      message: 'Invalid password'
    });
  });

  andThen(function(){
    fillIn('input[name="password"]', newPassword );
    fillIn('input[name="confirm-password"]', newPassword );
    click('button:contains(Change password)');
  });

  andThen(function(){
    fillIn('input[name="current-password"]', oldPassword);
    click('button:contains(Change password)');
  });

  andThen(function(){
    var error = find('.alert');
    ok(error.length, 'shows error');
    ok(error.text().indexOf('Invalid password') > -1,
       'shows error message');
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

    ok(!find('input[name="current-password"]').length,
       'does not show current password input');

    ok( find('button:contains(Change email)'),
        'has change email button');

    click('button:contains(Change email)');
  });

  andThen(function(){
    ok(find('input[name="current-password"]').length,
       'shows current password input');

    ok( find('button:contains(Change email)'),
        'still shows change email button');
  });
});

test('visit ' + settingsAccountUrl + ' allows change email', function(){
  expect(2);

  signInAndVisit(settingsAccountUrl);

  var newEmail = 'newEmail@example.com';
  var currentPassword = 'alkjsdf';

  stubRequest('put', '/users/user1', function(request){
    var user = JSON.parse(request.requestBody);

    equal(user.email, newEmail);
    equal(user.current_password, currentPassword);

    return this.success({
      id: 'user1',
      email: newEmail
    });
  });

  andThen(function(){
    fillIn('input[name="email"]', newEmail);
    click('button:contains(Change email)');
  });

  andThen(function(){
    fillIn('input[name="current-password"]', currentPassword);
    click('button:contains(Change email)');
  });
});

test('visit ' + settingsAccountUrl + ' change email and errors', function(){
  expect(2);

  signInAndVisit(settingsAccountUrl);

  var newEmail = 'newEmail@example.com';
  var currentPassword = 'alkjsdf';

  stubRequest('put', '/users/user1', function(request){
    var user = JSON.parse(request.requestBody);

    return this.error({
      code: 401,
      error: 'invalid_credentials',
      message: 'Invalid password'
    });
  });

  andThen(function(){
    fillIn('input[name="email"]', newEmail);
    click('button:contains(Change email)');
    fillIn('input[name="current-password"]', currentPassword);
    click('button:contains(Change email)');
  });

  andThen(function(){
    var error = find('.alert');
    ok(error.length, 'shows error div');
    ok(error.text().indexOf('Invalid password'), 'shows error message');
  });
});

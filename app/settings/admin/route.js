import Ember from 'ember';

export default Ember.Route.extend({
  actions: {
    changePassword: function(){
      var controller = this.controller;

      // Changing password is a 2-step process. We show the
      // "enter current password" input after clicking the button once
      if (!controller.get('changingPassword')) {
        controller.set('changingPassword', true);
        return;
      }

      var user = this.session.get('currentUser');

      user.save().then(function(){
        controller.set('changingPassword', false);
        user.set('passwordConfirmation', null);
      }).catch(function(e){
        var message = e.responseJSON ? e.responseJSON.message : e.message;
        if (!message) { message = 'Unknown error'; }
        controller.set('passwordError',message);
      });
    },

    changeEmail: function(){
      var controller = this.controller;

      // Changing email is a 2-step process. We show the
      // "enter current password" input after clicking the button once
      if (!controller.get('changingEmail')) {
        controller.set('changingEmail', true);
        return;
      }

      var user = this.session.get('currentUser');
      user.save().catch(function(e){
        var message = e.responseJSON ? e.responseJSON.message : e.message;
        if (!message) { message = 'Unknown error'; }
        controller.set('emailError',message);
      }).finally(function(){

        // Clears the current password input
        user.set('currentPassword', null);

        controller.set('changingEmail', false);
      });
    }
  }
});

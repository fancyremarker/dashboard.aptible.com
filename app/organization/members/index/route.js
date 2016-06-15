import Ember from 'ember';

export default Ember.Route.extend({
  model(){
    let organization = this.modelFor('organization');

    return Ember.RSVP.hash({
      organization: organization,
      users: organization.get('users'),
      invitations: organization.get('invitations')
    });
  },

  afterModel(model){
    // FIXME: This causes way too many queries. Users should have roles embedded.
    return Ember.RSVP.hash({
      roles: model.users.map(u => u.get('roles'))
    });
  },

  setupController(controller, model){
    controller.set('model', model.users);
    controller.set('organization', model.organization);
    controller.set('invitations', model.invitations);
  }
});

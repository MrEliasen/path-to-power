import Account from './model';
import request from 'superagent';
import config from '../../../../config.json';

export function login(action, callback) {
    request.get('https://api.twitch.tv/helix/users')
    .send()
    .set('Authorization', `Bearer ${action.payload.twitch_token}`)
    .set('Client-ID', config.twitch.clientId)
    .set('accept', 'json')
    .end((twitchErr, twitchRes) => {
        if (twitchErr) {
            return callback({
                type: 'error',
                message: 'Twitch communication error.'
            });
        }

        const twitchData = JSON.parse(twitchRes.text).data[0];

        Account.findOne({ twitch_id: escape(twitchData.id) }, { _id: 1 }, function (err, user) {
            if (err) {
                return callback({
                    type: 'error',
                    message: 'Internal server error',
                });
            }

            if (!user) {
                user = new Account({
                    twitch_id: twitchData.id
                });
            }

            user.display_name = twitchData.display_name;

            user.save((err) => {
                if (err) {
                    return callback({
                        type: 'error',
                        message: 'Internal server error'
                    });
                }

                callback(null, {
                    user_id: user._id,
                    display_name: twitchData.display_name,
                    profile_image: twitchData.profile_image_url
                });
            });
        });
    });
}
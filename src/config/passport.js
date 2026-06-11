const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const userModel = new User();
        const user = await userModel.model.findById(id).lean();
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Cấu hình Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret',
    callbackURL: '/auth/google/callback',
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const userModel = new User();
        // Kiểm tra xem user đã tồn tại bằng googleId chưa
        let user = await userModel.model.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // Kiểm tra xem email đã tồn tại chưa
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.id}@google.com`;
        user = await userModel.model.findOne({ email });
        
        if (user) {
            // Nếu có email, link googleId vào
            user.googleId = profile.id;
            if (!user.avatar && profile.photos && profile.photos.length > 0) user.avatar = profile.photos[0].value;
            await user.save();
            return done(null, user);
        }

        // Nếu chưa có, tạo mới
        user = await userModel.model.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            isVerified: true
        });
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// Cấu hình Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'placeholder_app_id',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'placeholder_app_secret',
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails', 'photos'],
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const userModel = new User();
        let user = await userModel.model.findOne({ facebookId: profile.id });
        if (user) return done(null, user);

        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.id}@facebook.com`;
        user = await userModel.model.findOne({ email });
        
        if (user) {
            user.facebookId = profile.id;
            if (!user.avatar && profile.photos && profile.photos.length > 0) user.avatar = profile.photos[0].value;
            await user.save();
            return done(null, user);
        }

        user = await userModel.model.create({
            name: profile.displayName,
            email: email,
            facebookId: profile.id,
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            isVerified: true
        });
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

module.exports = passport;

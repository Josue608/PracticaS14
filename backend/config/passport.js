const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Usuario = require("../models/Usuario");

const googleOAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
);

if (googleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();

          if (!email) {
            return done(new Error("Google no devolvio un email para esta cuenta"), null);
          }

          let usuario = await Usuario.findOne({ googleId: profile.id });

          if (!usuario) {
            usuario = await Usuario.findOne({ email });

            if (usuario) {
              usuario.googleId = profile.id;
              await usuario.save();
            } else {
              usuario = await Usuario.create({
                nombre: profile.displayName || email.split("@")[0],
                email,
                googleId: profile.id,
              });
            }
          }

          return done(null, usuario);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("Google OAuth no esta configurado. Revisa GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_CALLBACK_URL.");
}

passport.serializeUser((usuario, done) => {
  done(null, usuario.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await Usuario.findById(id);
    done(null, usuario);
  } catch (error) {
    done(error, null);
  }
});

passport.googleOAuthConfigured = googleOAuthConfigured;

module.exports = passport;

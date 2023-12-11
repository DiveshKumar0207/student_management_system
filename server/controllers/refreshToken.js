require("dotenv").config();
const jwt = require("jsonwebtoken");

const fs = require("fs");
const accessPrivateKey = fs.readFileSync(
  process.env.ACCESS_PRIVATE_KEY,
  "utf8"
);
const refreshPublicKey = fs.readFileSync(
  process.env.REFRESH_PUBLIC_KEY,
  "utf8"
);

// refreshThreshold = "29s";

//
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.jwtRefresh;

    if (!refreshToken) {
      res.status(401).json({ message: "1- unauthorized" });
    }

    // from verifyJWT middleware-> we defined req.user
    const user = req.user;

    //   checking refreshToken on db
    const WebRefreshToken = await user.refreshtokens.includes(refreshToken);
    if (!WebRefreshToken) res.status(403).json({ message: "1- forbidden" });

    //   verifying token
    try {
      var decoded = jwt.verify(refreshToken, refreshPublicKey, {
        algorithms: "ES256",
      });

      console.log("refresh-token verified");
    } catch (error) {
      console.log(`refresh verify err ${error}`);

      res.status(403).json({ message: "1- Forbidden" });
    }

    // const currentTime = Math.floor(Date.now() / 1000);

    //   generating new accesstoken
    // if (decoded.exp - currentTime < process.env.REFRESH_THRESHOLD) {
    const newAccessToken = jwt.sign(
      { _id: user._id, role: user.role },
      accessPrivateKey,
      {
        algorithm: "ES256",
        expiresIn: process.env.ACCESS_EXPIRE_TIME,
      }
    );

    console.log(`new-accessToken generated `);

    // set accessToken --> new cookie
    try {
      await res.clearCookie("jwtAccess");
      await res.cookie("jwtAccess", newAccessToken, {
        maxAge: 30 * 60 * 1000,
      });
      console.log("token set-");
    } catch (err) {
      console.log(`token regeneration err : ${err}`);
    }

    // console.log(req.cookies);

    res.status(200);
    // }
  } catch (err) {
    console.log(`error: ${err}`);
    res.status(401).json({ message: "1-unauthorized" });
  }
};

const { MongoClient } = require("mongodb");
const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 8000;
// const ObjectId = require("mongodb").ObjectId;

app.use(express.json());
app.use(fileUpload());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0r7r3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);

console.log(uri);
async function run() {
  try {
    await client.connect();
    const database = client.db("tripadvisor");
    const usersCollection = database.collection("usersList");
    // add  users by google registration

    app.put("/add-user", async (req, res) => {
      const user = req.body;

      let result = await usersCollection.find({ email: user?.email });
      console.log(result);
      if (result != user?.email) {
        result = await usersCollection.insertOne(user);
      } else {
        res.json({ message: "This email has already taken!" });
      }
    });
    // add  users by google sign in

    app.put("/add-user-by-google", async (req, res) => {
      const user = req.body;

      let result = await usersCollection.find({ email: user?.email });
      if (result != user?.email) {
        let newUser = {
          email: user.email,
          firstName: user.displayName.split(" ")[0],
          lastName: user.displayName.split(" ")[1],
          // profileimg: user.photoURL
        };
        result = await usersCollection.insertOne(newUser);
      } else {
        res.json({ message: "This email has already taken!" });
      }
    });

    // edit user info

    app.put(`/edit-profile`, async (req, res) => {
      const updatedInfo = req?.body;
      const userPreviousMail = req?.query?.email;
      const getProfileimg = req?.files?.profileimg;
      const getCoverimg = req?.files?.coverimg;
      console.log(" userPreviousMail", userPreviousMail);
      let encodedCoverImg;
      let encodedProfileImg;
      let bufferedCoverImg;
      let bufferedProfileImg;

      if (getProfileimg) {
        encodedProfileImg = getProfileimg.data?.toString("base64");
        
        bufferedProfileImg = Buffer.from(encodedProfileImg, "base64");
        
      } else if (getCoverimg) {
        
        encodedCoverImg = getCoverimg.data?.toString("base64");
        bufferedCoverImg = Buffer.from(encodedCoverImg, "base64");
      }

      let userPrevInfo = await usersCollection.findOne({
        email: userPreviousMail,
      });
      // console.log(userPrevInfo, ' previous information');
      if (userPrevInfo !== null) {
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            aboutyou:
              updatedInfo.about != ""
                ? updatedInfo.about
                : userPrevInfo.aboutyou,

            currentcity:
              updatedInfo?.currentcity != ""
                ? updatedInfo.currentcity
                : userPrevInfo.currentcity,
            email:
              updatedInfo?.email != ""
                ? updatedInfo.email
                : userPrevInfo.email,
            firstName:
              updatedInfo?.firstName != ""
                ? updatedInfo.firstName
                : userPrevInfo.firstName,
            lastName:
              updatedInfo?.lastName != ""
                ? updatedInfo.lastName
                : userPrevInfo.lastName,
            website:
              updatedInfo?.website != ""
                ? updatedInfo.website
                : userPrevInfo.website,
            profileimg:
              bufferedProfileImg != null
                ? bufferedProfileImg
                : userPrevInfo.profileimg,
            coverimg:
              bufferedCoverImg != null
                ? bufferedCoverImg
                : userPrevInfo.coverimg,
          },
        };

        result = await usersCollection.updateOne(
          userPrevInfo,
          updateDoc,
          options
        );
        res.send(result);
      } else {
        res.send({ message: "Failed" });

      }
    });


    app.get(`/user-data`, async (req, res) => {
      const userEmail = req?.query?.email;
      // console.log(userEmail, ' userr Email');
      const query = {email: userEmail}
      let result = await usersCollection?.findOne(query);
      // console.log(result, ' result!');
      res.send(result)
      // console.log(email);
    })


  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", function (req, res) {
  res.send("Hello World!");
});

app.listen(port, function () {
  console.log("App listening on port", port);
});

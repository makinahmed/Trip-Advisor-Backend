const { MongoClient } = require("mongodb");
const express = require("express");
const fileUpload = require("express-fileupload"); 
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;
const cors = require("cors");
app.use(express.json());
app.use(cors());
app.use(fileUpload())




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
      
      //   const result = await usersCollection.insertOne(user,update,options);
      let result = await usersCollection.find({ email: user?.email });
      console.log(result, ' i am result of google sign in');
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
      const encodedProfileImg = req?.files?.profileimg?.data?.toString("base64");
      const encodedCoverImg = req?.files?.coverimg?.data?.toString("base64");
      
      const bufferedProfileImg = Buffer.from(encodedProfileImg, "base64");

      const bufferedCoverImg = Buffer.from(encodedCoverImg, "base64");

      let userPrevInfo = await usersCollection.findOne({
        email: userPreviousMail,
      });
      
      if (userPrevInfo) {
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
              updatedInfo?.email != "" ? updatedInfo.email : userPrevInfo.email,
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
        res.send({message: 'Failed'})
      }
    });
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

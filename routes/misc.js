import express from "express";
import { search } from "../controllers/misc.js";
import fs from "fs";
import path from "path";
import ejs from "ejs";

const router = express.Router();

router.get("/search", search).get("/templates", (req, res, next) => {
  try {
    const temp = path.resolve(process.cwd(), `templates/pwdResetTemplate.ejs`);

    res.send(
      ejs.render(fs.readFileSync(temp, "utf-8"), {
        fullname:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaa",
        verifyLink: "httP://LOCAL",
        primaryColor: "#2196f3",
        secondaryColor: "#1769aa"
      })
    );
  } catch (err) {
    next(err);
  }
});

export default router;

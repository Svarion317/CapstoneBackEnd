import express from "express";
import authentication from "../middleware/authentication.js";
import {
  getAll,
  getById,
  update,
  remove,
} from "../controllers/utentiController.js";

const utentiRouter = express.Router();

utentiRouter.use(authentication);
utentiRouter.get("/", getAll);
utentiRouter.get("/:id", getById);
utentiRouter.put("/:id", update);
utentiRouter.delete("/:id", remove);

export default utentiRouter;

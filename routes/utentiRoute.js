import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/utentiController.js";

const utentiRouter = express.Router();

utentiRouter.post("/", create);
utentiRouter.get("/", getAll);
utentiRouter.get("/:id", getById);
utentiRouter.put("/:id", update);
utentiRouter.delete("/:id", remove);

export default utentiRouter;

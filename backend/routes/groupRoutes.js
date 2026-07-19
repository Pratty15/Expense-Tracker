import express from "express";
import Group from "../models/Group.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

/* Create Group */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { groupName, description, members } = req.body;

    const group = new Group({
      groupName,
      description,
      members,
      createdBy: req.userId,
    });

    await group.save();

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: "Error creating group" });
  }
});

/* Get All Groups */
router.get("/", verifyToken, async (req, res) => {
  try {
    const groups = await Group.find({
      createdBy: req.userId,
    }).sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Error fetching groups" });
  }
});

/* Get Single Group */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      createdBy: req.userId,
    });

    if (!group)
      return res.status(404).json({ message: "Group not found" });

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: "Error fetching group" });
  }
});

/* Update Group */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { groupName, description, members } = req.body;

    const group = await Group.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.userId,
      },
      {
        groupName,
        description,
        members,
      },
      {
        new: true,
      }
    );

    if (!group)
      return res.status(404).json({ message: "Group not found" });

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: "Error updating group" });
  }
});

/* Delete Group */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId,
    });

    if (!group)
      return res.status(404).json({ message: "Group not found" });

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting group" });
  }
});

export default router;
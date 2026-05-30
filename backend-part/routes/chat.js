const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/chatController");
const { protect } = require("../middleware/auth");
const upload  = require("../middleware/upload");

router.use(protect);

router.get("/",                                    ctrl.getMyChats);
router.post("/",                                   ctrl.getOrCreateChat);
router.get("/:chatId",                             ctrl.getChatMessages);
router.post("/:chatId/messages", upload.single("image"), ctrl.sendMessage);
router.post("/:chatId/messages/:msgId/react",      ctrl.reactToMessage);
router.delete("/:chatId/messages/:msgId",          ctrl.deleteMessage);
router.delete("/:chatId",                          ctrl.deleteChat);

module.exports = router;

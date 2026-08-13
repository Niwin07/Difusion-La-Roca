const { Router } = require("express");

const router = Router();

router.use(require("./health"));
router.use(require("./predicas"));
router.use(require("./sync"));
router.use(require("./congreso"));
router.use(require("./audio"));
router.use(require("./push"));
router.use(require("./cron"));

module.exports = router;

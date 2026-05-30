const express = require('express');
const router  = express.Router();
const {
  createOffer,
  getSellerOffers,
  getBuyerOffers,
  respondToOffer,
  createOrderFromOffer,
  deleteOffer,
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // all offer routes require auth

router.post('/',              createOffer);                          // buyer creates offer
router.get('/seller',         authorize('vendor','admin'), getSellerOffers); // seller sees offers
router.get('/buyer',          getBuyerOffers);                       // buyer sees sent offers
router.put('/:id',            respondToOffer);                       // seller responds
router.post('/:id/order',     createOrderFromOffer);                 // buyer places order from offer
router.delete('/:id',         deleteOffer);                          // buyer withdraws

module.exports = router;

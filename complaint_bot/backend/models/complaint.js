const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  complaint: { type: String, required: true },
  location:  { type: String, required: true },
  contact:   { type: String, required: true },
  others:    { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Complaint", complaintSchema);

// Test script để kiểm tra order service
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint đơn giản
app.post("/api/orders/test", (req, res) => {
  console.log("📥 Test order request received:", req.body);
  console.log("📥 Headers:", req.headers);

  res.json({
    success: true,
    message: "Test order endpoint working!",
    data: {
      orderId: "test-123",
      receivedData: req.body,
    },
  });
});

app.listen(5555, () => {
  console.log("🧪 Test order service running on port 5555");
  console.log("Test endpoint: http://localhost:5555/api/orders/test");
});

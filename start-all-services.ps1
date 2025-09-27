# 🚀 Start All Services Script

# Dừng tất cả node processes trước
echo "🛑 Stopping all Node.js processes..."
taskkill /f /im node.exe 2>$null

# Chờ 2 giây
Start-Sleep -Seconds 2

echo "🔧 Starting all backend services..."

# Start Auth Service (Port 5001)
echo "🔐 Starting Auth Service on port 5001..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Backend\auth-service'; node index.js"

# Wait 1 second
Start-Sleep -Seconds 1

# Start Customer Service (Port 5002) 
echo "👤 Starting Customer Service on port 5002..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Backend\customer-service'; node index.js"

# Wait 1 second
Start-Sleep -Seconds 1

# Start Menu Service (Port 5003)
echo "🍽️ Starting Menu Service on port 5003..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Backend\menu-service'; node index.js"

# Wait 1 second
Start-Sleep -Seconds 1

# Start Inventory Service (Port 5004)
echo "📦 Starting Inventory Service on port 5004..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Backend\inventory-service'; node index.js"

# Wait 1 second  
Start-Sleep -Seconds 1

# Start Order Service (Port 5005)
echo "🛒 Starting Order Service on port 5005..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Backend\order-service'; node index.js"

# Wait 1 second
Start-Sleep -Seconds 1

# Start Table Service (Port 5006)
echo "🪑 Starting Table Service on port 5006..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Backend\table-service'; node index.js"

# Wait 3 seconds for all services to start
Start-Sleep -Seconds 3

echo "✅ All services should be starting up!"
echo ""
echo "📋 Service Status:"
echo "🔐 Auth Service:      http://localhost:5001" 
echo "👤 Customer Service:  http://localhost:5002"
echo "🍽️ Menu Service:      http://localhost:5003"
echo "📦 Inventory Service: http://localhost:5004"
echo "🛒 Order Service:     http://localhost:5005"
echo "🪑 Table Service:     http://localhost:5006"
echo ""
echo "🌐 Frontend:          http://localhost:5173"
echo ""
echo "🔍 To check if services are running:"
echo "   netstat -an | findstr :500"
echo ""
echo "⚡ To start frontend:"
echo "   cd Fontend\my-restaurant-app"
echo "   npm run dev"
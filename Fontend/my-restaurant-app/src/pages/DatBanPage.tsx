import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  location: string;
  status: string;
  features?: string[];
}

const DatBanPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        date,
        startTime,
        endTime,
        partySize: partySize.toString(),
      });
      const res = await fetch(`http://localhost:5006/api/tables/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTables(data.data.tables);
      } else {
        setError(data.message || 'Không thể tải danh sách bàn');
      }
    } catch (e) {
      setError('Lỗi khi tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date && startTime && endTime && partySize) {
      fetchTables();
    }
    // eslint-disable-next-line
  }, [date, startTime, endTime, partySize]);

  const handleReserve = async (table: Table) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5006/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          tableId: table._id,
          reservationDate: date,
          timeSlot: { startTime, endTime, duration: 120 },
          partySize,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Đặt bàn thành công!');
        setSelectedTable(null);
        fetchTables();
      } else {
        setError(data.message || 'Đặt bàn thất bại');
      }
    } catch (e) {
      setError('Lỗi khi đặt bàn');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      <main style={{ padding: '40px 0', minHeight: '60vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '30px', textAlign: 'center' }}>
            ĐẶT BÀN NHÀ HÀNG
          </h1>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div>
              <label>Ngày:</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ marginLeft: 8 }} />
            </div>
            <div>
              <label>Giờ bắt đầu:</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ marginLeft: 8 }} />
            </div>
            <div>
              <label>Giờ kết thúc:</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ marginLeft: 8 }} />
            </div>
            <div>
              <label>Số người:</label>
              <input type="number" min={1} max={20} value={partySize} onChange={e => setPartySize(Number(e.target.value))} style={{ marginLeft: 8, width: 60 }} />
            </div>
            <button onClick={fetchTables} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Tìm bàn trống
            </button>
          </div>
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: 16 }}>{success}</div>}
          {loading ? (
            <div>Đang tải danh sách bàn...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {tables.length === 0 ? (
                <div>Không có bàn trống phù hợp.</div>
              ) : (
                tables.map(table => (
                  <div key={table._id} style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0ea5e9', marginBottom: 8 }}>Bàn {table.tableNumber}</h3>
                    <div>Sức chứa: {table.capacity} người</div>
                    <div>Vị trí: {table.location}</div>
                    <div>Trạng thái: {table.status === 'available' ? 'Còn trống' : table.status}</div>
                    {table.features && table.features.length > 0 && (
                      <div>Tiện ích: {table.features.join(', ')}</div>
                    )}
                    <button onClick={() => handleReserve(table)} style={{ marginTop: 16, background: '#22c55e', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                      Đặt bàn này
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DatBanPage;

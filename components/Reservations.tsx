
import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { MOCK_RESERVATIONS } from '../constants';
import { Reservation } from '../types';

const Reservations: React.FC = () => {
    const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);
    const [newRes, setNewRes] = useState({ name: '', partySize: '2', time: '' });

    const handleAddReservation = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newRes.name || !newRes.time) return;

        const newReservation: Reservation = {
            id: Date.now(),
            name: newRes.name,
            partySize: parseInt(newRes.partySize, 10),
            time: newRes.time,
            status: 'upcoming',
        };
        setReservations([newReservation, ...reservations]);
        setNewRes({ name: '', partySize: '2', time: '' });
    };

    const getStatusChip = (status: Reservation['status']) => {
        const styles = {
            upcoming: 'bg-blue-100 text-blue-800',
            seated: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-sparrow-blue-900 mb-8 font-serif">Manage Reservations</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Reservation Form */}
                <div className="lg:col-span-1">
                    <Card>
                        <h2 className="text-2xl font-bold text-sparrow-blue-800 mb-4">Add New Reservation</h2>
                        <form onSubmit={handleAddReservation} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" id="name" value={newRes.name} onChange={e => setNewRes({...newRes, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sparrow-gold-500 focus:border-sparrow-gold-500" required />
                            </div>
                             <div>
                                <label htmlFor="partySize" className="block text-sm font-medium text-gray-700">Party Size</label>
                                <input type="number" id="partySize" value={newRes.partySize} onChange={e => setNewRes({...newRes, partySize: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sparrow-gold-500 focus:border-sparrow-gold-500" min="1" required />
                            </div>
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time</label>
                                <input type="time" id="time" value={newRes.time} onChange={e => setNewRes({...newRes, time: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sparrow-gold-500 focus:border-sparrow-gold-500" required />
                            </div>
                            <Button type="submit" className="w-full">Add Reservation</Button>
                        </form>
                    </Card>
                </div>

                {/* Reservation List */}
                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-2xl font-bold text-sparrow-blue-800 mb-4">Today's Bookings</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-gray-200">
                                    <tr>
                                        <th className="py-2 px-4">Time</th>
                                        <th className="py-2 px-4">Name</th>
                                        <th className="py-2 px-4">Guests</th>
                                        <th className="py-2 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.sort((a,b) => a.time.localeCompare(b.time)).map(res => (
                                        <tr key={res.id} className="border-b border-gray-100 hover:bg-sparrow-blue-50">
                                            <td className="py-3 px-4 font-bold text-sparrow-blue-900">{res.time}</td>
                                            <td className="py-3 px-4">{res.name}</td>
                                            <td className="py-3 px-4 text-center">{res.partySize}</td>
                                            <td className="py-3 px-4">{getStatusChip(res.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Reservations;

"use client";

import { useState, useEffect } from "react";

export default function DistributorDashboard() {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    category: "300ml",
    quantity: "",
    amountKes: "",
    invoiceDate: ""
  });
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [ordersRes, returnsRes, invoicesRes, agentsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/bottle-returns"),
        fetch("/api/invoices"),
        fetch("/api/users?role=delivery_agent")
      ]);
      const [ordersData, returnsData, invoicesData, agentsData] = await Promise.all([
        ordersRes.json(),
        returnsRes.json(),
        invoicesRes.json(),
        agentsRes.json()
      ]);
      setOrders(ordersData);
      setReturns(returnsData);
      setInvoices(invoicesData);
      setAgents(agentsData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function updateOrder(orderId, updates) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function submitInvoice(e) {
    e.preventDefault();
    setSubmittingInvoice(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          quantity: Number(invoiceForm.quantity),
          amountKes: Number(invoiceForm.amountKes),
          invoiceDate: new Date(invoiceForm.invoiceDate).toISOString()
        })
      });
      setSubmittingInvoice(false);
      if (res.ok) {
        setInvoiceForm({
          invoiceNumber: "",
          category: "300ml",
          quantity: "",
          amountKes: "",
          invoiceDate: ""
        });
        fetchData();
      }
    } catch (err) {
      setSubmittingInvoice(false);
      console.error(err);
    }
  }

  const openOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "approved"
  ).length;
  const onRoute = orders.filter((o) => o.status === "dispatched").length;
  const bottleGaps = returns.filter(
    (r) => r.returnStatus === "partial" || r.returnStatus === "none"
  ).length;

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Distributor Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Open Orders</p>
          <p className="text-3xl font-bold text-[#D85A30]">{openOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">On Route</p>
          <p className="text-3xl font-bold text-[#D85A30]">{onRoute}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Bottle Gaps</p>
          <p className="text-3xl font-bold text-red-500">{bottleGaps}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4">HQ Invoice Recorder</h3>
        <form onSubmit={submitInvoice} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <input
            type="text"
            placeholder="Invoice No"
            required
            value={invoiceForm.invoiceNumber}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })
            }
            className="px-4 py-2 border rounded-lg text-sm"
          />
          <input
            type="date"
            required
            value={invoiceForm.invoiceDate}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })
            }
            className="px-4 py-2 border rounded-lg text-sm"
          />
          <select
            value={invoiceForm.category}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, category: e.target.value })
            }
            className="px-4 py-2 border rounded-lg text-sm"
          >
            {["300ml", "500ml", "1L", "maid", "dasani", "monster"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Qty"
            required
            min="1"
            value={invoiceForm.quantity}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, quantity: e.target.value })
            }
            className="px-4 py-2 border rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="Amount KES"
            required
            min="1"
            value={invoiceForm.amountKes}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, amountKes: e.target.value })
            }
            className="px-4 py-2 border rounded-lg text-sm"
          />
          <button
            type="submit"
            disabled={submittingInvoice}
            className="md:col-span-5 py-2 bg-[#D85A30] text-white rounded-lg font-medium disabled:opacity-50"
          >
            {submittingInvoice ? "Saving..." : "Save Invoice"}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Invoice #</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Qty</th>
                <th className="text-left p-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-t">
                  <td className="p-3">{inv.invoiceNumber}</td>
                  <td className="p-3">
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">{inv.category}</td>
                  <td className="p-3">{inv.quantity}</td>
                  <td className="p-3">KES {inv.amountKes}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-3 text-gray-500 text-center">
                    No invoices yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4">Pending Orders</h3>
        <div className="space-y-4">
          {orders
            .filter((o) => o.status !== "delivered")
            .map((order) => (
              <div key={order._id} className="border rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold">{order.retailer?.name || "Unknown"}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      order.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : order.status === "approved"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  {order.crates?.map((c, i) => (
                    <span key={i} className="mr-3">
                      {c.crateType}: {c.items?.length || 0} SKUs
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={order.assignedAgentId || ""}
                    onChange={(e) =>
                      updateOrder(order._id, {
                        assignedAgentId: e.target.value || null
                      })
                    }
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Assign Agent</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>

                  {order.status === "pending" && (
                    <button
                      onClick={() =>
                        updateOrder(order._id, { status: "approved" })
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Approve
                    </button>
                  )}

                  {order.status === "approved" && order.assignedAgentId && (
                    <button
                      onClick={() =>
                        updateOrder(order._id, { status: "dispatched" })
                      }
                      className="px-4 py-2 bg-[#D85A30] text-white rounded-lg text-sm font-medium hover:bg-[#c44e28] transition"
                    >
                      Dispatch
                    </button>
                  )}
                </div>
              </div>
            ))}
          {orders.filter((o) => o.status !== "delivered").length === 0 && (
            <p className="text-gray-500 text-center py-4">No pending orders</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4">Bottle Return Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Retailer</th>
                <th className="text-left p-3 font-medium">Agent</th>
                <th className="text-left p-3 font-medium">Crates</th>
                <th className="text-left p-3 font-medium">Bottles</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => (
                <tr
                  key={ret._id}
                  className={`border-t ${
                    ret.returnStatus === "partial" || ret.returnStatus === "none"
                      ? "bg-red-50"
                      : ""
                  }`}
                >
                  <td className="p-3">{ret.retailer?.name || "N/A"}</td>
                  <td className="p-3">{ret.agent?.name || "N/A"}</td>
                  <td className="p-3">{ret.cratesDelivered}</td>
                  <td className="p-3">{ret.bottlesReturned}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        ret.returnStatus === "full"
                          ? "bg-green-100 text-green-700"
                          : ret.returnStatus === "partial"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {ret.returnStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    {new Date(ret.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-3 text-gray-500 text-center">
                    No returns yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

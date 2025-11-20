import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRentalRequestById,
  approveRentalRequest,
  rejectRentalRequest,
} from "../../../../api/services/rentalRequests.service";
import { useAuth } from "../../../../hooks/useAuth";
import { HiArrowLeft } from "react-icons/hi2";
import { FiChevronLeft } from "react-icons/fi";

function RentalRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current logged-in user

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for approval
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  useEffect(() => {
    // Auto-calculate end date when start date or lease duration changes
    if (startDate && request?.leaseDurationMonths) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + request.leaseDurationMonths);
      setEndDate(end.toISOString().split("T")[0]);
    }
  }, [startDate, request?.leaseDurationMonths]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRentalRequestById(id);
      setRequest(data);

      // Set default start date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow.toISOString().split("T")[0]);
    } catch (err) {
      console.error("Failed to fetch rental request:", err);
      setError("Failed to load rental request details.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (!startDate || !endDate) {
      setError("Please select start and end dates for the lease.");
      return;
    }
    setActionType("approve");
    setShowConfirmModal(true);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setActionType("reject");
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (actionType === "approve") {
        // Get admin user ID from authenticated user
        if (!user || !user.id) {
          setError("User not authenticated. Please log in again.");
          setShowConfirmModal(false);
          return;
        }

        const approvalData = {
          approvedByUserId: user.id, // Use actual logged-in user ID
          startDate: startDate,
          endDate: endDate,
        };

        console.log("Approving request:", {
          requestId: id,
          ...approvalData,
        });

        await approveRentalRequest(id, approvalData);
        alert("Request approved successfully! Lease has been created.");
      } else if (actionType === "reject") {
        // Get admin user ID from authenticated user
        if (!user || !user.id) {
          setError("User not authenticated. Please log in again.");
          setShowConfirmModal(false);
          return;
        }

        const rejectionData = {
          reason: rejectionReason,
          rejectedByUserId: user.id, // Use actual logged-in user ID
        };

        console.log("Rejecting request:", {
          requestId: id,
          ...rejectionData,
        });

        await rejectRentalRequest(id, rejectionData);
        alert("Request rejected successfully.");
      }

      // Navigate back to list
      navigate("/admin/rental-requests");
    } catch (err) {
      console.error("Error processing request:", err);
      setError(err.message || "Failed to process request.");
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
      if (!error) {
        setShowConfirmModal(false);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTotalAmount = () => {
    if (!request?.unit || !request?.leaseDurationMonths) return 0;
    return request.unit.rentAmount * request.leaseDurationMonths;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Loading request details...</div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate("/admin/rental-requests")}
          className="flex lg:gap-2 gap-1 items-center btn border-2 lg:py-2 lg:px-4 p-1 rounded-lg hover:translate-y-[-1px] hover:shadow-md cursor-pointer text-xs lg:text-base"
        >
          <FiChevronLeft /> Back to Requests
        </button>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const isActionable = request.status === "PENDING";

  return (
    <div className="mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/rental-requests")}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-500 mb-6"
      >
        <HiArrowLeft className="w-5 h-5" />
        Back to Requests
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="title mb-2">
              Rental Request Details
            </h1>
            <p className="text-gray-600 mt-1">Request ID: #{request.id}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeColor(
              request.status
            )}`}
          >
            {request.status}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Request Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          REQUEST INFORMATION
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Submitted</p>
            <p className="text-base text-gray-900">
              {formatDate(request.requestDate)}
            </p>
          </div>
          {request.approvedDate && (
            <div>
              <p className="text-sm font-medium text-gray-600">
                {request.status === "APPROVED" ? "Approved" : "Processed"}
              </p>
              <p className="text-base text-gray-900">
                {formatDate(request.approvedDate)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Unit Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          UNIT DETAILS
        </h2>
        {request.unit ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Unit Number</p>
              <p className="text-base text-gray-900">
                Si {request.unit.roomNumber}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Type</p>
              <p className="text-base text-gray-900">{request.unit.unitType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Rent</p>
              <p className="text-base text-gray-900">
                {request.unit.rentAmount} ฿
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Floor</p>
              <p className="text-base text-gray-900">{request.unit.floor}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Size</p>
              <p className="text-base text-gray-900">
                {request.unit.sizeSqm} sqm
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-base text-gray-900">{request.unit.status}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Unit ID: {request.unitId}</p>
        )}
      </div>

      {/* Tenant Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          TENANT INFORMATION
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Name</p>
            <p className="text-base text-gray-900">
              {request.firstName} {request.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Email</p>
            <p className="text-base text-gray-900">{request.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Phone</p>
            <p className="text-base text-gray-900">{request.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Occupation</p>
            <p className="text-base text-gray-900">
              {request.occupation || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Emergency Contact
            </p>
            <p className="text-base text-gray-900">
              {request.emergencyContact || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Emergency Phone</p>
            <p className="text-base text-gray-900">
              {request.emergencyPhone || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Lease Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          LEASE DETAILS
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Duration</p>
            <p className="text-base text-gray-900">
              {request.leaseDurationMonths} month
              {request.leaseDurationMonths > 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Amount</p>
            <p className="text-base text-green-600 font-semibold">
              {calculateTotalAmount().toFixed(2)} ฿
            </p>
          </div>
        </div>
        {request.notes && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Notes</p>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded">
              {request.notes}
            </p>
          </div>
        )}
      </div>

      {/* Rejection Reason (if rejected) */}
      {request.status === "REJECTED" && request.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-red-900">
            REJECTION REASON
          </h2>
          <p className="text-red-800">{request.rejectionReason}</p>
        </div>
      )}

      {/* Admin Actions (only for PENDING requests) */}
      {isActionable && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            ADMIN ACTIONS
          </h2>

          {/* Lease Start and End Date */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">
              Lease Period (Required for Approval)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When tenant can move in
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lease expiration date
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason (if rejecting)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
              placeholder="Provide a reason if you're rejecting this request..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate("/admin/rental-requests")}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              Reject Request
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              Approve & Create Lease
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {actionType === "approve"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </h3>
            <p className="text-gray-700 mb-6">
              {actionType === "approve"
                ? `Are you sure you want to approve this rental request? This will create a lease from ${startDate} to ${endDate} and update the user's role to VILLAGER.`
                : "Are you sure you want to reject this rental request? This action cannot be undone."}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-white rounded-lg ${
                  actionType === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                } disabled:bg-gray-400`}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RentalRequestDetailPage;

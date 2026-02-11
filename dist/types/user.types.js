"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = isAdmin;
exports.isBranchManager = isBranchManager;
exports.getUserRole = getUserRole;
exports.getUserBranch = getUserBranch;
exports.canAccessBranch = canAccessBranch;
// Type guard functions - simplified logic
function isAdmin(user) {
    return "email" in user && "name" in user;
}
function isBranchManager(user) {
    return "applicationId" in user;
}
// Helper function to get user role safely
function getUserRole(user) {
    if (isAdmin(user)) {
        return user.role === "Super-Admin" ? "Super-Admin" : "Branch-Admin";
    }
    else {
        return "Branch-Admin";
    }
}
// Helper function to get user branch safely
function getUserBranch(user) {
    if (isBranchManager(user)) {
        return user.branch;
    }
    return null; // Super-Admin doesn't have a specific branch
}
// Helper function to check if user can access branch data
function canAccessBranch(user, branchId) {
    var _a;
    if (isAdmin(user)) {
        // Super-Admin can access all branches
        return true;
    }
    else if (isBranchManager(user)) {
        // Branch-Admin can only access their own branch
        return ((_a = user.branch) === null || _a === void 0 ? void 0 : _a.toString()) === branchId;
    }
    return false;
}

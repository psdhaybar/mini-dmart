export const getDashboardPath = (role) => {
  switch (role?.toUpperCase()) {
    case "CUSTOMER":
      return "/customer";

    case "STAFF":
      return "/staff";

    case "MANAGER":
      return "/manager";

    case "ADMIN":
      return "/admin";

    default:
      return "/login";
  }
};
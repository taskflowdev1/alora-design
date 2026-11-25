export const prefix = "R";
export default ({ S, stage, pop, phone, atStage, none, clickIn, center }) => [
  S("button-dark", "Buttons", "/components/button", "desk", "dark", atStage),
  S("select-open-light", "Select open", "/components/select", "desk", "light", clickIn(`${stage} [aria-haspopup=listbox]`), stage, { extra: ["[role=listbox]", pop] }),
  S("orders-1024", "Orders at 1024", "/examples/orders", "desk1024", "dark", none, "viewport"),
  S("m-orders", "Phone orders", "/mobile/app/orders", "phone", "dark", none, "viewport"),
  S("m-sheet", "Bottom sheet in its phone frame", "/mobile/mobile-sheet", "deskTall", "dark", (p) => center(p, phone), phone),
];

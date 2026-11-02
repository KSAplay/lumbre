/** Etiqueta de sala a partir del número de mesa del plano. */
export const formatTableLabel = (number: number) =>
  `Mesa ${String(number).padStart(2, "0")}`;

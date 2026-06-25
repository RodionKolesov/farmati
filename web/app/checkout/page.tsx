import { redirect } from "next/navigation";

// Оформление теперь происходит прямо в корзине (одностраничный заказ).
// Старый адрес /checkout перенаправляем на /cart.
export default function CheckoutPage() {
  redirect("/cart");
}

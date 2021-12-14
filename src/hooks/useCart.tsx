import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    } else {
      return [];
    }
  });

  const addProduct = async (productId: number) => {
    try {
      // Incrementar o carrinho de compras
      const productResponse = await api.get(`/products/${productId}`);
      const stockResponse = await api.get(`/stock/${productId}`);

      if (productResponse.status === 200 && stockResponse.status === 200) {
        const targetProduct: Product = productResponse.data;
        const stockTarget: UpdateProductAmount = stockResponse.data;

        const productIncCart = cart.find((product) => product.id === productId);

        if (!productIncCart) {
          targetProduct.amount = 1;
          setCart([...cart, targetProduct]);
          return localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...cart, targetProduct])
          );
        } else {
          let setItem = true;
          const updatedCart = cart.map((product) => {
            if (product.id === productId) {
              if (product.amount < stockTarget.amount) {
                product.amount = product.amount + 1;
              } else {
                setItem = false;
                toast.error("Quantidade solicitada fora de estoque");
              }
            }
            return product;
          });
          if (setItem) {
            setCart(updatedCart);
            return localStorage.setItem(
              "@RocketShoes:cart",
              JSON.stringify(updatedCart)
            );
          }
        }
      } else {
        throw new Error("Erro na adição do produto");
      }
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // Remover do carrinho de compras
      const removedCart = cart.find((product) => product.id === productId);
      if (removedCart) {
        const removedItemFromCart = cart.filter(
          (product) => product.id !== productId
        );
        setCart(removedItemFromCart);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(removedItemFromCart)
        );
      } else {
        throw new Error("Erro na remoção do produto");
      }
    } catch {
      // TODO
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const response = await api.get(`/stock/${productId}`);
      if (response.status === 200) {
        const stock: Stock = response.data;
        const cartProduct = cart.find((product) => product.id === productId);

        if (cartProduct) {
          const isHigherThanZero = amount > 0;
          const isBellowStock = amount <= stock.amount;

          if (isBellowStock && isHigherThanZero) {
            cartProduct.amount = amount;
            localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
            setCart([...cart]);
          } else {
            toast.error("Quantidade solicitada fora de estoque");
          }
        }
      } else {
        toast.error("Erro na alteração de quantidade do produto");
      }
    } catch {
      // TODO
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

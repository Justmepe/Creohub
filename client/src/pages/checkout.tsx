import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import logoPath from "@assets/Logo_1749474304178.png";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import PesapalPayment from "@/components/payments/PesapalPayment";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PriceDisplay } from "@/components/ui/price-display";
import { apiRequest } from "@/lib/queryClient";
import type { OrderItem, ShippingAddress } from "@/lib/types";
import {
  ShoppingCart,
  Package,
  Truck,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  shippingAddress: z.object({
    fullName: z.string().min(2, "Full name is required"),
    address: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    postalCode: z.string().min(3, "Postal code is required"),
    country: z.string().min(2, "Country is required"),
    phone: z.string().optional(),
  }).optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { creatorId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentCurrency } = useCurrency();
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState<number | null>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: {
        fullName: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Kenya",
        phone: "",
      },
    },
  });

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: [`/api/creators/${creatorId}`],
    enabled: !!creatorId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/creators/${creatorId}`);
      return response.json();
    }
  });

  const { data: products } = useQuery({
    queryKey: [`/api/creators/${creatorId}/products`],
    enabled: !!creatorId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/creators/${creatorId}/products`);
      return response.json();
    }
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${creatorId}`);
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else if (products && products.length > 0) {
      // Create mock cart item for demo
      const mockItem: OrderItem = {
        productId: products[0].id,
        name: products[0].name,
        price: parseFloat(products[0].price),
        quantity: 1,
        type: products[0].type,
      };
      setCartItems([mockItem]);
    }
  }, [creatorId, products]);

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const hasPhysicalItems = cartItems.some(item => item.type === "physical");

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.productId !== productId));
    } else {
      setCartItems(cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
    localStorage.setItem(`cart_${creatorId}`, JSON.stringify(cartItems));
  };

  const onSubmit = (data: CheckoutFormData) => {
    toast({
      title: "Customer details validated",
      description: "Please proceed with payment below.",
    });
  };

  if (creatorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Creator Not Found</h3>
            <p className="text-gray-600 mb-4">The creator you're trying to purchase from doesn't exist.</p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 4 && orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h3>
            <p className="text-gray-600 mb-4">
              Thank you for your purchase. Your order #{orderId} has been placed successfully.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/storefront/${creator.storeHandle}`}>
                  Continue Shopping
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  Explore More Creators
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href={`/storefront/${creator.storeHandle}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Store
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <img 
                  src={logoPath} 
                  alt="Creohub" 
                  className="h-6 w-6"
                />
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {creator.storeName}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="lg:order-2">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="text-sm mx-2">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <PriceDisplay
                        originalPrice={item.price * item.quantity}
                        originalCurrency="KES"
                        size="sm"
                        className="font-semibold"
                      />
                      <div className="text-sm text-gray-500">
                        <PriceDisplay
                          originalPrice={item.price}
                          originalCurrency="KES"
                          size="sm"
                        /> each
                      </div>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <PriceDisplay
                      originalPrice={totalAmount}
                      originalCurrency="KES"
                      size="sm"
                    />
                  </div>
                  {hasPhysicalItems && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Shipping</span>
                      <span>Calculated at next step</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <PriceDisplay
                      originalPrice={totalAmount}
                      originalCurrency="KES"
                      size="lg"
                      className="font-semibold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="lg:order-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+254 700 000 000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Shipping Address (only for physical products) */}
                {hasPhysicalItems && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Shipping Address
                      </CardTitle>
                      <CardDescription>
                        Required for physical products delivery
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="shippingAddress.fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Recipient's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shippingAddress.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Street address, building, apartment"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingAddress.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Nairobi" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shippingAddress.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/County</FormLabel>
                              <FormControl>
                                <Input placeholder="Nairobi County" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingAddress.postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input placeholder="00100" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shippingAddress.country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="Kenya" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Method */}
                <PesapalPayment
                  amount={totalAmount}
                  currency="KES"
                  productId={cartItems[0]?.productId.toString() || "ORDER"}
                  productName={cartItems.map(item => item.name).join(", ")}
                  customerEmail={form.watch("customerEmail") || ""}
                  customerPhone={form.watch("customerPhone") || ""}
                  customerName={form.watch("customerName") || ""}
                  onSuccess={(data) => {
                    toast({
                      title: "Payment Successful",
                      description: "Your order has been confirmed!",
                    });
                    setStep(4);
                    setOrderId(data.order_id);
                  }}
                  onCancel={() => {
                    toast({
                      title: "Payment Cancelled",
                      description: "You can try again when ready.",
                    });
                  }}
                />

                {/* Order Total Display */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total Order Value:</span>
                    <span className="text-2xl font-bold text-primary">
                      KES {totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Payment will be processed securely through Pesapal
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
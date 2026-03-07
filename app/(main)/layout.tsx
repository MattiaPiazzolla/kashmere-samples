import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GlobalPlayer from '@/components/player/GlobalPlayer'
import CartDrawer from "@/components/cart/CartDrawer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      {children}
      <Footer />
      <GlobalPlayer />
    </>
  )
}
import HomeBanner from "../components/HomeBanner";
import ShopIntro from "../components/ShopIntro";
import CategorySection from "../components/CategorySection";
import FeaturedProducts from "../components/FeaturedProducts";

/*
 * Trang Home ghép banner, giới thiệu, sản phẩm nổi bật và danh mục sản phẩm.
 */
function Home() {
    return (
        <main>
            <HomeBanner />
            <ShopIntro />
            <FeaturedProducts />
            <CategorySection />
        </main>
    );
}

export default Home;

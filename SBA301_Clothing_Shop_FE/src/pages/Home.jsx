import HomeBanner from "../components/HomeBanner";
import ShopIntro from "../components/ShopIntro";
import CategorySection from "../components/CategorySection";
import FeaturedProducts from "../components/FeaturedProducts";
import "../css/HomeRefresh.css";

/*
 * Nguyen Duy Khang
 * Trang Home ghép banner, giới thiệu, sản phẩm nổi bật và danh mục sản phẩm.
 */
function Home() {
    return (
        <main>
            <HomeBanner />
            <CategorySection />
            <FeaturedProducts />
            <ShopIntro />
        </main>
    );
}

export default Home;

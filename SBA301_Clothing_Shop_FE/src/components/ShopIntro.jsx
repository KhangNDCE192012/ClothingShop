import "../css/ShopIntro.css";

function ShopIntro() {
    return (
        <section className="shop-intro">
            <div className="shop-intro-wrapper">

                <div className="shop-intro-heading">
                    <p className="shop-intro-label">
                        About Us
                    </p>

                    <h2 className="shop-intro-title">
                        Về Clothing Shop
                    </h2>

                    <div className="shop-intro-divider"></div>

                    <p className="shop-intro-description">
                        Clothing Shop mang đến những sản phẩm thời trang hiện đại,
                        tối giản và dễ ứng dụng trong cuộc sống hằng ngày.
                        Chúng tôi mong muốn giúp bạn tự tin thể hiện phong cách riêng
                        qua từng lựa chọn trang phục.
                    </p>
                </div>

                <div className="shop-intro-features">

                    <div className="shop-intro-card">
            <span className="shop-intro-number">
              01
            </span>

                        <h3>Modern Style</h3>

                        <p>
                            Thiết kế hiện đại, trẻ trung và dễ dàng
                            kết hợp với nhiều phong cách khác nhau.
                        </p>
                    </div>

                    <div className="shop-intro-card">
            <span className="shop-intro-number">
              02
            </span>

                        <h3>Quality First</h3>

                        <p>
                            Chú trọng chất lượng sản phẩm và trải nghiệm
                            tốt nhất dành cho khách hàng.
                        </p>
                    </div>

                    <div className="shop-intro-card">
            <span className="shop-intro-number">
              03
            </span>

                        <h3>Everyday Fashion</h3>

                        <p>
                            Trang phục dễ ứng dụng trong cuộc sống,
                            từ đi học, đi làm đến những buổi dạo phố.
                        </p>
                    </div>

                </div>

            </div>
        </section>
    );
}

export default ShopIntro;
/**
 * Component hiển thị Banner chính tại Trang chủ (Home).
 * Giới thiệu thông điệp thời trang của cửa hàng và hình ảnh đại diện thương hiệu.
 */
import { Container } from "react-bootstrap";
import Banner from "../assets/Banner.png";
import "../css/Home.css";

/*
 * Nguyen Duy Khang
 * Giới thiệu cửa hàng và dẫn khách tới danh mục sản phẩm.
 */
function HomeBanner() {
    return (
        <section
            className="home-banner"
            style={{
                backgroundImage: `linear-gradient(
          rgba(0, 0, 0, 0.35),
          rgba(0, 0, 0, 0.25)
        ), url(${Banner})`,
            }}
        >
            <Container fluid className="home-banner-content">
                <p className="home-banner-subtitle">CLOTHING SHOP</p>
                <h1>Trang phục cho mỗi ngày</h1>

                <p className="home-banner-description">
                    Chọn danh mục, xem các mẫu đang bán và tìm món đồ phù hợp với bạn.
                </p>
            
            </Container>
        </section>
    );
}

export default HomeBanner;

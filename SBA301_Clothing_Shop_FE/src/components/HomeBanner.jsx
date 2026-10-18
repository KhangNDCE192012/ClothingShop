import { Container } from "react-bootstrap";
import Banner from "../assets/Banner.png";
import "../css/Home.css";

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
                <p className="home-banner-subtitle">
                    NEW COLLECTION 2026
                </p>

                <h1>AVENUE STUDIO</h1>

                <p className="home-banner-description">
                    Khám phá những sản phẩm thời trang mới dành cho bạn.
                </p>
            </Container>
        </section>
    );
}

export default HomeBanner;
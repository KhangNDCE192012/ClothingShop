package vn.edu.fpt.sba301_clothing_shop.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;
import vn.edu.fpt.sba301_clothing_shop.controller.*;
import vn.edu.fpt.sba301_clothing_shop.dto.request.CheckoutRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.CheckoutResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.UserResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.security.config.SecurityConfig;
import vn.edu.fpt.sba301_clothing_shop.service.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

@WebMvcTest({
        UserController.class,
        OrderController.class,
        CartController.class,
        ProductController.class,
        CategoryController.class
})
@EnableWebSecurity
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuthenticationConfiguration.class})
class SecurityAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private CartService cartService;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private VariantService variantService;

    @MockitoBean
    private CategoryService categoryService;

    @BeforeEach
    void setUp() {
        // Mock default responses for successful controller executions
        when(userService.getCustomers()).thenReturn(Collections.emptyList());
        when(userService.getInforUser(anyString())).thenReturn(new User());
        when(userService.lockCustomer(anyInt())).thenReturn(
                new UserResponse(1, "testuser", "test@example.com", "Test User", "0123456789", "CUSTOMER", "ACTIVE", LocalDateTime.now())
        );
        when(orderService.getAllOrder()).thenReturn(Collections.emptyList());
        when(orderService.getOrderById(anyInt())).thenReturn(Collections.emptyList());
        when(orderService.checkout(anyString(), any(CheckoutRequest.class))).thenReturn(
                new CheckoutResponse(1, "PENDING", "COD", BigDecimal.ZERO, BigDecimal.ZERO, LocalDateTime.now(), "Success")
        );
        when(cartService.getMyCart(anyString())).thenReturn(Collections.emptyList());
        when(categoryService.getAllCategories()).thenReturn(Collections.emptyList());
        when(variantService.getVariantsByProductId(anyInt())).thenReturn(Collections.emptyList());
    }

    private static ResultMatcher isNot401Or403() {
        return result -> {
            int code = result.getResponse().getStatus();
            assertNotEquals(401, code, "HTTP status must not be 401 Unauthorized");
            assertNotEquals(403, code, "HTTP status must not be 403 Forbidden");
        };
    }

    @Nested
    @DisplayName("BL-030: User APIs Authorization")
    class UserAuthorizationTests {

        @Test
        @DisplayName("GET /api/users - 401 unauthenticated, 403 CUSTOMER, 200 ADMIN")
        void testGetUsersAuthorization() throws Exception {
            // Không token -> 401
            mockMvc.perform(get("/api/users"))
                    .andExpect(status().isUnauthorized());

            // CUSTOMER -> 403
            mockMvc.perform(get("/api/users").with(user("customer").roles("CUSTOMER")))
                    .andExpect(status().isForbidden());

            // ADMIN -> 200
            mockMvc.perform(get("/api/users").with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /api/users/me - 401 unauthenticated, 200 CUSTOMER, 200 ADMIN")
        void testGetUsersMeAuthorization() throws Exception {
            // Không token -> 401
            mockMvc.perform(get("/api/users/me"))
                    .andExpect(status().isUnauthorized());

            // CUSTOMER -> 200
            mockMvc.perform(get("/api/users/me").with(user("customer").roles("CUSTOMER")))
                    .andExpect(status().isOk());

            // ADMIN -> 200
            mockMvc.perform(get("/api/users/me").with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("PATCH /api/users/{id}/lock - 401 unauthenticated, 403 CUSTOMER, non-401/403 ADMIN")
        void testPatchUserAuthorization() throws Exception {
            // Không token -> 401
            mockMvc.perform(patch("/api/users/1/lock"))
                    .andExpect(status().isUnauthorized());

            // CUSTOMER -> 403
            mockMvc.perform(patch("/api/users/1/lock").with(user("customer").roles("CUSTOMER")))
                    .andExpect(status().isForbidden());

            // ADMIN -> 200 (không phải 401/403)
            mockMvc.perform(patch("/api/users/1/lock").with(user("admin").roles("ADMIN")))
                    .andExpect(isNot401Or403())
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("DELETE /api/users/{id} - 401 unauthenticated, 403 CUSTOMER, non-401/403 ADMIN")
        void testDeleteUserAuthorization() throws Exception {
            // Không token -> 401
            mockMvc.perform(delete("/api/users/1"))
                    .andExpect(status().isUnauthorized());

            // CUSTOMER -> 403
            mockMvc.perform(delete("/api/users/1").with(user("customer").roles("CUSTOMER")))
                    .andExpect(status().isForbidden());

            // ADMIN -> 204 No Content (không phải 401/403)
            mockMvc.perform(delete("/api/users/1").with(user("admin").roles("ADMIN")))
                    .andExpect(isNot401Or403())
                    .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("BL-030 & BL-028: Order APIs Authorization")
    class OrderAuthorizationTests {

        @Test
        @DisplayName("GET /api/orders/manage - 401 unauthenticated, 403 CUSTOMER, non-401/403 ADMIN")
        void testGetOrdersManageAuthorization() throws Exception {
            // Không token -> 401
            mockMvc.perform(get("/api/orders/manage"))
                    .andExpect(status().isUnauthorized());

            // CUSTOMER -> 403
            mockMvc.perform(get("/api/orders/manage").with(user("customer").roles("CUSTOMER")))
                    .andExpect(status().isForbidden());

            // ADMIN -> 200 (không phải 401/403)
            mockMvc.perform(get("/api/orders/manage").with(user("admin").roles("ADMIN")))
                    .andExpect(isNot401Or403())
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /api/orders/manage/{id} - 401 unauthenticated, 403 CUSTOMER, non-401/403 ADMIN")
        void testGetOrdersManageByIdAuthorization() throws Exception {
            // Không token -> 401
            mockMvc.perform(get("/api/orders/manage/1"))
                    .andExpect(status().isUnauthorized());

            // CUSTOMER -> 403
            mockMvc.perform(get("/api/orders/manage/1").with(user("customer").roles("CUSTOMER")))
                    .andExpect(status().isForbidden());

            // ADMIN -> 200 (không phải 401/403)
            mockMvc.perform(get("/api/orders/manage/1").with(user("admin").roles("ADMIN")))
                    .andExpect(isNot401Or403())
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("POST /api/orders/checkout - 401 unauthenticated, non-401/403 CUSTOMER")
        void testPostOrderCheckoutAuthorization() throws Exception {
            String checkoutJson = """
                    {
                      "receiverName": "Nguyen Van A",
                      "receiverPhone": "0987654321",
                      "deliveryAddress": "123 Tran Hung Dao",
                      "items": [
                        {
                          "variantId": 1,
                          "quantity": 2
                        }
                      ]
                    }
                    """;

            // Không token -> 401
            mockMvc.perform(post("/api/orders/checkout")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(checkoutJson))
                    .andExpect(status().isUnauthorized());

            // CUSTOMER -> không bị 401-403 (201 Created)
            mockMvc.perform(post("/api/orders/checkout")
                            .with(user("customer").roles("CUSTOMER"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(checkoutJson))
                    .andExpect(isNot401Or403());
        }
    }

    @Nested
    @DisplayName("BL-028: Cart APIs Authorization")
    class CartAuthorizationTests {

        @Test
        @DisplayName("GET /api/carts - 401 unauthenticated, non-401/403 CUSTOMER")
        void testGetCartAuthorization() throws Exception {
            // Không token -> 401
            mockMvc.perform(get("/api/carts"))
                    .andExpect(status().isUnauthorized());

            // CUSTOMER -> không bị 401-403 (200 OK)
            mockMvc.perform(get("/api/carts").with(user("customer").roles("CUSTOMER")))
                    .andExpect(isNot401Or403())
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("BL-028 & BL-029: Public & Product APIs Authorization")
    class ProductAuthorizationTests {

        @Test
        @DisplayName("GET /api/products/{id} & GET /api/categories - 200 permitAll (không cần token)")
        void testPublicEndpointsAuthorization() throws Exception {
            // GET /api/products/1 -> 200
            mockMvc.perform(get("/api/products/1"))
                    .andExpect(status().isOk());

            // GET /api/categories -> 200
            mockMvc.perform(get("/api/categories"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("POST/PUT/DELETE /api/products - 401 unauthenticated, 403 CUSTOMER, non-401/403 ADMIN (404/405)")
        void testProductWriteApisAuthorization() throws Exception {
            // POST /api/products
            mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
            mockMvc.perform(post("/api/products").with(user("customer").roles("CUSTOMER")).contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/products").with(user("admin").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(isNot401Or403());

            // PUT /api/products/1
            mockMvc.perform(put("/api/products/1").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
            mockMvc.perform(put("/api/products/1").with(user("customer").roles("CUSTOMER")).contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
            mockMvc.perform(put("/api/products/1").with(user("admin").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(isNot401Or403());

            // DELETE /api/products/1
            mockMvc.perform(delete("/api/products/1"))
                    .andExpect(status().isUnauthorized());
            mockMvc.perform(delete("/api/products/1").with(user("customer").roles("CUSTOMER")))
                    .andExpect(status().isForbidden());
            mockMvc.perform(delete("/api/products/1").with(user("admin").roles("ADMIN")))
                    .andExpect(isNot401Or403());
        }

        @Test
        @DisplayName("POST/PUT/DELETE /api/categories - 401 unauthenticated, 403 CUSTOMER, non-401/403 ADMIN (BL-012)")
        void testCategoryWriteApisAuthorization() throws Exception {
            // POST /api/categories
            mockMvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Test\"}"))
                    .andExpect(status().isUnauthorized());
            mockMvc.perform(post("/api/categories").with(user("customer").roles("CUSTOMER")).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Test\"}"))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/categories").with(user("admin").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Test\"}"))
                    .andExpect(isNot401Or403());

            // PUT /api/categories/1
            mockMvc.perform(put("/api/categories/1").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Test\"}"))
                    .andExpect(status().isUnauthorized());
            mockMvc.perform(put("/api/categories/1").with(user("customer").roles("CUSTOMER")).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Test\"}"))
                    .andExpect(status().isForbidden());
            mockMvc.perform(put("/api/categories/1").with(user("admin").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Test\"}"))
                    .andExpect(isNot401Or403());

            // DELETE /api/categories/1
            mockMvc.perform(delete("/api/categories/1"))
                    .andExpect(status().isUnauthorized());
            mockMvc.perform(delete("/api/categories/1").with(user("customer").roles("CUSTOMER")))
                    .andExpect(status().isForbidden());
            mockMvc.perform(delete("/api/categories/1").with(user("admin").roles("ADMIN")))
                    .andExpect(isNot401Or403());
        }
    }
}

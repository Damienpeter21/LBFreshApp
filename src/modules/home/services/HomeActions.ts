import { axiosInstance } from "../../../app";

export const homeBanner = async (): Promise<any> => {
    try {
        const response = await axiosInstance({
            method: "POST",
            url: "/jsonrpc",
            data: {
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "service": "object",
                    "method": "execute_kw",
                    "args": [
                        "home_delivery",
                        2,
                        "1234",
                        "loyalty.program",
                        "search_read",
                        [
                            [
                                ["active", "=", true],
                                ["sale_ok", "=", true]
                            ]
                        ],
                        {
                            "fields": [
                                "id",
                                "name",
                                "date_from",
                                "date_to",
                                "program_type",
                                "trigger",
                                "trigger_product_ids",
                                "reward_ids",
                                "rule_ids"
                            ],
                            "order": "sequence asc",
                            "limit": 50
                        }
                    ]
                },
                "id": 101
            }
        });

        return response.data;
    } catch (error) {
        console.error("Error in banner:", error);
        throw error;
    }
};

export const getProductCategoriesData = async (): Promise<any> => {
    try {
        const response = await axiosInstance({
            method: "POST",
            url: "/jsonrpc",
            data: {
                jsonrpc: "2.0",
                method: "call",
                params: {
                    service: "object",
                    method: "execute_kw",
                    args: [
                        "home_delivery",
                        2,
                        "1234",
                        "product.category",
                        "search_read",
                        [[]],
                        {
                            fields: [
                                "id",
                                "name",
                                "complete_name",
                                "parent_id",
                            ],
                        },
                    ],
                },
                id: 3,
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error in getProductCategoriesData:", error);
        throw error;
    }
};

export const getDealoftheDay = async (): Promise<any> => {
    try {
        const response = await axiosInstance({
            method: "POST",
            url: "/jsonrpc",
            data: {
                jsonrpc: "2.0",
                method: "call",
                params: {
                    service: "object",
                    method: "execute_kw",
                    args: [
                        "home_delivery",
                        2,
                        "1234",
                        "product.template",
                        "search_read",
                        [
                            [
                                ["is_deal_of_the_day", "=", true]
                            ]
                        ],
                        {
                            fields: [
                                "id",
                                "name",
                                "list_price",
                                "mrp_price",
                                "discount_percentage",
                                "discounted_price",
                                "categ_id",
                                "qty_available",
                                "uom_id",
                                "uom_name",
                                "delivery_time_days",
                                "sale_delay",
                                "is_deal_of_the_day",
                                "description_sale",
                                "description",
                                "product_tag_ids",
                                "lb_rating_avg",
                                "lb_review_count",
                            ],
                            limit: 50,
                        },
                    ]
                },
                id: 21,
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error in getDealoftheDay:", error);
        throw error;
    }
};

export const getNewArrival = async (): Promise<any> => {
    try {
        const response = await axiosInstance({
            method: "POST",
            url: "/jsonrpc",
            data: {
                jsonrpc: "2.0",
                method: "call",
                params: {
                    service: "object",
                    method: "execute_kw",
                    args: [
                        "home_delivery",
                        2,
                        "1234",
                        "product.template",
                        "search_read",
                        [
                            [
                                ["website_ribbon_id.name", "=", "New Arrivals"],
                                ["sale_ok", "=", true]
                            ]
                        ],
                        {
                            fields: [
                                "id",
                                "name",
                                "list_price",
                                "mrp_price",
                                "discount_percentage",
                                "discounted_price",
                                "categ_id",
                                "qty_available",
                                "uom_id",
                                "uom_name",
                                "delivery_time_days",
                                "sale_delay",
                                "is_deal_of_the_day",
                                "description_sale",
                                "description",
                                "product_tag_ids",
                                "lb_rating_avg",
                                "lb_review_count",
                            ],
                            limit: 50,
                        },
                    ]
                },
                id: 21,
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error in getNewArrival:", error);
        throw error;
    }
};

export const getPopularProducts = async (): Promise<any> => {
    try {
        const response = await axiosInstance({
            method: "POST",
            url: "/jsonrpc",
            data: {
                jsonrpc: "2.0",
                method: "call",
                params: {
                    service: "object",
                    method: "execute_kw",
                    args: [
                        "home_delivery",
                        2,
                        "1234",
                        "product.template",
                        "search_read",
                        [
                            [
                                ["is_deal_of_the_day", "=", true]
                            ]
                        ],
                        {
                            fields: [
                                "id",
                                "name",
                                "list_price",
                                "mrp_price",
                                "discount_percentage",
                                "discounted_price",
                                "categ_id",
                                "qty_available",
                                "uom_id",
                                "uom_name",
                                "delivery_time_days",
                                "sale_delay",
                                "is_deal_of_the_day",
                                "description_sale",
                                "description",
                                "product_tag_ids",
                                "lb_rating_avg",
                                "lb_review_count",
                            ],
                            limit: 50,
                        },
                    ]
                },
                id: 22,
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error in getPopularProducts:", error);
        throw error;
    }
};
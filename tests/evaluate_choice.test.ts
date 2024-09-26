/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handler } from "../functions/evaluate_choice";
import { currentPrice } from "~/utils/api.server";
import { getUserDetails, setResult } from "~/utils/dynamo.server";
import { publish } from "~/utils/sqs.server";

vi.mock("~/utils/api.server");
vi.mock("~/utils/dynamo.server");
vi.mock("~/utils/sqs.server");

describe("handler", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.useFakeTimers();
        vi.mocked(setResult).mockImplementation(async (userId, data) => ({
            value: { user_id: userId, ...data } as any,
        }));
    });

    it("should republish event if less than 50 seconds have passed", async () => {
        const mockEvent = {
            Records: [
                {
                    body: JSON.stringify({
                        type: "choice_created",
                        data: {
                            userId: "123",
                            move: "high",
                            time: Date.now() - 40000,
                            price: 30000,
                        },
                    }),
                },
            ],
        };

        await handler(mockEvent);

        expect(publish).toHaveBeenCalledWith(
            JSON.parse(mockEvent.Records[0].body),
        );
    });

    //   it('should process event if more than 50 seconds have passed', async () => {
    //     vi.setSystemTime(Date.now());

    //     const mockEvent = {
    //       Records: [{
    //         body: JSON.stringify({
    //           type: "choice_created",
    //           data: {
    //             userId: "123",
    //             move: "high",
    //             time: Date.now() - 60000,
    //             price: 30000
    //           }
    //         })
    //       }]
    //     };

    //     const mockPriceResponse = {
    //      value:{ bpi: {
    //         USD: {
    //           code: "USD",
    //           rate: "31000",
    //           description: "United States Dollar",
    //           rate_float: 31000
    //         },
    //         BTC: {
    //           code: "BTC",
    //           rate: "1",
    //           description: "Bitcoin",
    //           rate_float: 1
    //         }
    //       }}
    //     } as const;

    //     const mockUserDetails = {
    //         value: {
    //            user_id: "123",
    //             score: 5,
    //           current_move: "low" as const,
    //           current_move_outcome: null,
    //       }
    //     };

    //     vi.mocked(currentPrice).mockResolvedValue(mockPriceResponse);
    //     vi.mocked(getUserDetails).mockResolvedValue(mockUserDetails);

    //     await handler(mockEvent);

    //     expect(currentPrice).toHaveBeenCalledWith("BTC");
    //     expect(getUserDetails).toHaveBeenCalledWith("123");
    //     expect(setResult).toHaveBeenCalledWith("123", {
    //       current_move_outcome: "high",
    //       score: 6
    //     });
    //   });

    it("should handle incorrect prediction", async () => {
        vi.setSystemTime(Date.now());

        const mockEvent = {
            Records: [
                {
                    body: JSON.stringify({
                        type: "choice_created",
                        data: {
                            userId: "123",
                            move: "high",
                            time: Date.now() - 60000,
                            price: 31000,
                        },
                    }),
                },
            ],
        };

        const mockPriceResponse = {
            value: {
                bpi: {
                    USD: {
                        code: "USD",
                        rate: "30000",
                        description: "United States Dollar",
                        rate_float: 30000,
                    },
                    BTC: {
                        code: "BTC",
                        rate: "1",
                        description: "Bitcoin",
                        rate_float: 1,
                    },
                },
            },
        } as const;

        const mockUserDetails = {
            value: {
                user_id: "123",
                score: 5,
                current_move: "low" as const,
                current_move_outcome: null,
            },
        };

        vi.mocked(currentPrice).mockResolvedValue(mockPriceResponse);
        vi.mocked(getUserDetails).mockResolvedValue(mockUserDetails);

        await handler(mockEvent);

        expect(setResult).toHaveBeenCalledWith("123", {
            current_move_outcome: "low",
            score: 4,
        });
    });

    it("should handle price staying the same", async () => {
        vi.setSystemTime(Date.now());

        const mockEvent = {
            Records: [
                {
                    body: JSON.stringify({
                        type: "choice_created",
                        data: {
                            userId: "123",
                            move: "high",
                            time: Date.now() - 60000,
                            price: 30000,
                        },
                    }),
                },
            ],
        };

        const mockPriceResponse = {
            value: {
                bpi: {
                    USD: {
                        code: "USD",
                        rate: "30000",
                        description: "United States Dollar",
                        rate_float: 30000,
                    },
                    BTC: {
                        code: "BTC",
                        rate: "1",
                        description: "Bitcoin",
                        rate_float: 1,
                    },
                },
            },
        } as const;

        const mockUserDetails = {
            value: {
                user_id: "123",
                score: 5,
                current_move: "low" as const,
                current_move_outcome: null,
            },
        };

        vi.mocked(currentPrice).mockResolvedValue(mockPriceResponse);
        vi.mocked(getUserDetails).mockResolvedValue(mockUserDetails);

        await handler(mockEvent);

        expect(publish).toHaveBeenCalledWith({
            type: "choice_created",
            data: {
                userId: "123",
                move: "high",
                time: expect.any(Number),
                price: 30000,
            },
        });
    });

    it("should throw error if user not found", async () => {
        vi.setSystemTime(Date.now());

        const mockEvent = {
            Records: [
                {
                    body: JSON.stringify({
                        type: "choice_created",
                        data: {
                            userId: "123",
                            move: "high",
                            time: Date.now() - 60000,
                            price: 30000,
                        },
                    }),
                },
            ],
        };

        const mockPriceResponse = {
            value: {
                bpi: {
                    USD: {
                        code: "USD",
                        rate: "31000",
                        description: "United States Dollar",
                        rate_float: 31000,
                    },
                    BTC: {
                        code: "BTC",
                        rate: "1",
                        description: "Bitcoin",
                        rate_float: 1,
                    },
                },
            },
        } as const;

        vi.mocked(currentPrice).mockResolvedValue(mockPriceResponse);
        vi.mocked(getUserDetails).mockResolvedValue({ value: null });

        await expect(handler(mockEvent)).rejects.toThrow("User not found");
    });
});

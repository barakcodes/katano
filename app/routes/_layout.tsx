import { Outlet } from "@remix-run/react";

export default function AuthLayout() {
    return (
        <div className="relative  min-h-full ">
            <div className="mt-16 min-h-full  md:px-12  lg:px-0">
                <div className="relative z-10 flex flex-1 flex-col justify-center px-4 py-12 md:flex-none md:px-28">
                    <main className="mx-auto w-full max-w-md sm:px-4  md:px-0">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}

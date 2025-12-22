"use client";

import React from "react";
import Link from "next/link";

export default function HombreLegacyRedirectPage() {
	return (
		<main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
			<div className="text-center p-4">
				<h1 className="h4 fw-bold mb-3">Sección de hombre movida</h1>
				<p className="text-muted mb-3">
					La antigua sección de productos para hombre ya no está disponible
					en la nueva versión de EcoReserva.
				</p>
				<Link href="/" className="btn btn-dark">
					Volver al inicio
				</Link>
			</div>
		</main>
	);
}


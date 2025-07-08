import { Package } from 'lucide-react';
import ModulePlaceholder from '@/components/module-placeholder';

export default function GestionPedidosPage() {
    return (
        <ModulePlaceholder
            icon={Package}
            title="Gestión de Pedidos de Materiales"
            description="Organice y siga los pedidos de material POP y otros insumos."
        />
    );
}

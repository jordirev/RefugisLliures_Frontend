import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Wrench, Calendar, MapPin, Plus, Info } from 'lucide-react';
import refugiCinquantenari from 'figma:asset/7bb5dcfc259b5c332d27d72447bcf89144cc3704.png';
import cortalOriol from 'figma:asset/f3afca70c9a23de06cec6bad26fd115b542b9911.png';
import refugiPerafita from 'figma:asset/f3b639be036bc34c6ae34331625761d8932d9518.png';

interface Reform {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  imageUrl: string;
}

interface ReformsViewProps {
  onReformClick?: (reform: Reform) => void;
}

export function ReformsView({ onReformClick }: ReformsViewProps) {
  const reforms: Reform[] = [
    {
      id: '1',
      title: 'Refugi del Cinquantenari',
      description: 'Goteres a la sala principal que requereixen reparació urgent.',
      location: 'Àreu',
      date: '2026-02-15',
      status: 'pending',
      priority: 'high',
      imageUrl: refugiCinquantenari
    },
    {
      id: '2',
      title: 'Cortal de l\'Oriol',
      description: 'Instal·lació de panells solars per millorar l\'eficiència energètica.',
      location: 'Bellver de Cerdanya',
      date: '2026-03-10',
      status: 'in-progress',
      priority: 'medium',
      imageUrl: cortalOriol
    },
    {
      id: '3',
      title: 'Refugi de Perafita',
      description: 'Actualització completa dels equips de cuina i sistemes de ventilació.',
      location: 'Andorra',
      date: '2026-01-20',
      status: 'completed',
      priority: 'medium',
      imageUrl: refugiPerafita
    },
    {
      id: '4',
      title: 'Refugi de Respomuso',
      description: 'Manteniment del sender d\'accés després de les últimes pluges.',
      location: 'Vall de Tena',
      date: '2026-02-28',
      status: 'pending',
      priority: 'low',
      imageUrl: 'https://images.unsplash.com/photo-1739379930431-fb710a7ffc09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGh1dCUyMHdvb2RlbiUyMGNhYmlufGVufDF8fHx8MTc1OTI1ODk0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    }
  ];

  const getStatusColor = (status: Reform['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Reform['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Reform['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendent';
      case 'in-progress':
        return 'En progrés';
      case 'completed':
        return 'Completat';
      default:
        return 'Desconegut';
    }
  };

  const getPriorityText = (priority: Reform['priority']) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Mitjana';
      case 'low':
        return 'Baixa';
      default:
        return 'Normal';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 pb-8">
        <div className="flex items-center gap-2 mb-6 pt-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h2 className="text-gray-900">Reformes i Millores</h2>
          <span className="text-sm text-gray-500">({reforms.length})</span>
          <div className="ml-auto">
            <div className="flex items-center justify-center">
              <Info className="w-6 h-6 text-black" />
            </div>
          </div>
        </div>
        
        {/* Les meves reformes */}
        <div className="mb-6">
          <h3 className="mb-4 text-gray-700">Les meves reformes</h3>
          {reforms.slice(0, 1).map((reform) => (
            <Card key={reform.id} className="cursor-pointer shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="mb-1">{reform.title}</h3>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{reform.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{new Date(reform.date).toLocaleDateString('ca-ES')}</span>
                    </div>
                  </div>
                  <div className="w-24 h-24 rounded-lg overflow-hidden">
                    <img
                      src={reform.imageUrl}
                      alt={reform.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">{reform.description}</p>
                
                <a 
                  href="https://chat.whatsapp.com/exemple-grup-reforma" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm mb-5 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Uneix-te al grup de WhatsApp
                </a>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {/* TODO: Implementar navegació al mapa */}}
                  >
                    Veure en el mapa
                  </Button>
                  <Button 
                    variant="secondary"
                    size="sm" 
                    className="flex-1"
                    onClick={() => {/* TODO: Implementar veure participants */}}
                  >
                    + Informació
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Separador */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Título para otras reformas */}
        <h3 className="mb-4 text-gray-700">Altres reformes</h3>

        {/* Altres reformes */}
        <div className="space-y-4">
          {reforms.slice(1).map((reform) => (
            <Card key={reform.id} className="cursor-pointer shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="mb-1">{reform.title}</h3>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{reform.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{new Date(reform.date).toLocaleDateString('ca-ES')}</span>
                    </div>
                  </div>
                  <div className="w-24 h-24 rounded-lg overflow-hidden">
                    <img
                      src={reform.imageUrl}
                      alt={reform.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">{reform.description}</p>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {/* TODO: Implementar navegació al mapa */}}
                  >
                    Veure en el mapa
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {/* TODO: Implementar unir-se */}}
                  >
                    Uneix-me
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Botó flotant per crear nova reforma */}
      <Button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-2xl drop-shadow-2xl hover:shadow-orange-500/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 z-50"
        onClick={() => {/* TODO: Implementar crear nova reforma */}}
      >
        <Plus className="w-10 h-10 stroke-[4]" />
      </Button>
    </div>
  );
}
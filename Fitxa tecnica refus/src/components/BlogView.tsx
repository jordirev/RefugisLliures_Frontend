import React from 'react';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  imageUrl?: string;
}

interface BlogViewProps {
  posts: BlogPost[];
  onPostClick: (post: BlogPost) => void;
}

export function BlogView({ posts, onPostClick }: BlogViewProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <div className="mb-6">
          <h2>Blog de Aventuras</h2>
          <p className="text-muted-foreground">
            Descubre historias, consejos y guías de montañismo
          </p>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-0">
                {post.imageUrl && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{post.category}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>

                  <h3 className="mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{post.author}</span>
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      <span>{post.date}</span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPostClick(post)}
                      className="text-primary hover:text-primary/80"
                    >
                      Leer más
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}